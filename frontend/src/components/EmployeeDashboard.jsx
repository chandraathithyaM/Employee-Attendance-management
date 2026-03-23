import { useState, useEffect, useRef } from 'react';
import {
    FaUserCircle, FaCalendarCheck, FaEnvelope, FaPhone,
    FaBuilding, FaCalendar, FaUmbrellaBeach, FaPlus, FaClock, FaCheck,
    FaMapMarkerAlt, FaWifi, FaVolumeUp, FaMicrophone, FaStop
} from 'react-icons/fa';
import { getProfile, getMyAttendance, getMyLeaves, markMyAttendance } from '../services/api';
import LeaveForm from './LeaveForm';

// ── Ultrasonic Decoder (Updated Range: 16.5–18.5 kHz) ───────────────────────
const ULTRASONIC_BASE_FREQ = 16500;
const ULTRASONIC_FREQ_STEP = 50; 
const ULTRASONIC_BIT_DURATION = 0.15;
const TOKEN_LENGTH = 8;

function findPeakFrequency(analyser, sampleRate) {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyser.getFloatFrequencyData(dataArray);

    const minBin = Math.floor(ULTRASONIC_BASE_FREQ / (sampleRate / bufferLength));
    const maxBin = Math.ceil((ULTRASONIC_BASE_FREQ + 40 * ULTRASONIC_FREQ_STEP + 200) / (sampleRate / bufferLength));

    let maxVal = -Infinity;
    let maxIdx = minBin;
    for (let i = minBin; i <= maxBin && i < bufferLength; i++) {
        if (dataArray[i] > maxVal) {
            maxVal = dataArray[i];
            maxIdx = i;
        }
    }

    if (maxVal < -60) return null; 
    return (maxIdx * sampleRate) / bufferLength;
}

function freqToChar(freq) {
    const offset = Math.round((freq - ULTRASONIC_BASE_FREQ) / ULTRASONIC_FREQ_STEP);
    for (let c = 32; c < 127; c++) {
        if (c % 40 === offset) return String.fromCharCode(c);
    }
    return null;
}

const statusColors = {
    PRESENT: 'status-present',
    ABSENT: 'status-absent',
    LATE: 'status-late',
};

const leaveStatusColors = {
    PENDING: 'leave-pending',
    APPROVED: 'leave-approved',
    DENIED: 'leave-denied',
};

const EmployeeDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('profile');
    const [showLeaveForm, setShowLeaveForm] = useState(false);

    // Attendance marking state
    const [otpInput, setOtpInput] = useState('');
    const [markingAttendance, setMarkingAttendance] = useState(false);
    const [attendanceMsg, setAttendanceMsg] = useState(null);
    const [attendanceMode, setAttendanceMode] = useState('LOCATION');

    const VERIFICATION_MODES = [
        { id: 'LOCATION', label: 'Location', icon: <FaMapMarkerAlt />, desc: 'GPS-proximity check (50m)' },
        { id: 'WIFI', label: 'WiFi', icon: <FaWifi />, desc: 'Same Public IP verification' },
        { id: 'ULTRASONIC', label: 'Ultrasonic', icon: <FaVolumeUp />, desc: 'Secure sound-based check' },
    ];

    // Ultrasonic listening state
    const [isListening, setIsListening] = useState(false);
    const [capturedToken, setCapturedToken] = useState('');
    const [listeningProgress, setListeningProgress] = useState(0);
    const audioCtxRef = useRef(null);
    const streamRef = useRef(null);
    const analyserRef = useRef(null);
    const animFrameRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [profileRes, attendanceRes, leavesRes] = await Promise.all([
                getProfile(),
                getMyAttendance(),
                getMyLeaves(),
            ]);
            setProfile(profileRes.data);
            setAttendance(attendanceRes.data);
            setLeaves(leavesRes.data);
        } catch (err) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async () => {
        if (!otpInput) return;
        setMarkingAttendance(true);
        setAttendanceMsg({ type: 'info', text: 'Processing...' });

        try {
            const payload = {
                otp: otpInput,
                status: 'PRESENT',
                verificationMode: attendanceMode,
            };

            if (attendanceMode === 'LOCATION') {
                setAttendanceMsg({ type: 'info', text: 'Acquiring precise location...' });
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        maximumAge: 0,
                        timeout: 10000,
                    });
                });
                payload.latitude = position.coords.latitude;
                payload.longitude = position.coords.longitude;
            }

            // WIFI mode is now automatic via IP on backend

            if (attendanceMode === 'ULTRASONIC') {
                setAttendanceMsg({ type: 'info', text: '📡 Starting to listen for ultrasonic signal...' });
                let token = await startListening();
                if (!token) {
                    setAttendanceMsg({ type: 'error', text: 'Failed to capture ultrasonic signal. Please try again.' });
                    setMarkingAttendance(false);
                    return;
                }
                payload.ultrasonicToken = token;
            }

            await markMyAttendance(payload);
            setAttendanceMsg({ type: 'success', text: '✅ Attendance marked successfully!' });
            setOtpInput('');
            setCapturedToken('');
            fetchData();
        } catch (err) {
            setAttendanceMsg({
                type: 'error',
                text: err.response?.data?.error || err.message || 'Failed to mark attendance.'
            });
        } finally {
            setMarkingAttendance(false);
        }
    };

    const startListening = () => {
        return new Promise(async (resolve) => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;

                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                audioCtxRef.current = audioCtx;

                const source = audioCtx.createMediaStreamSource(stream);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 8192;
                source.connect(analyser);
                analyserRef.current = analyser;

                setIsListening(true);
                setCapturedToken('');
                setListeningProgress(0);

                let chars = [];
                let sampleCount = 0;
                const samplesPerChar = Math.ceil((ULTRASONIC_BIT_DURATION * 1000) / 50);

                const listen = () => {
                    if (!audioCtxRef.current) {
                        resolve(null);
                        return;
                    }

                    const freq = findPeakFrequency(analyser, audioCtx.sampleRate);
                    if (freq) {
                        sampleCount++;
                        if (sampleCount >= samplesPerChar) {
                            const char = freqToChar(freq);
                            if (char) {
                                chars.push(char);
                                setListeningProgress(Math.min(100, (chars.length / TOKEN_LENGTH) * 100));
                                if (chars.length >= TOKEN_LENGTH) {
                                    const token = chars.slice(0, TOKEN_LENGTH).join('');
                                    setCapturedToken(token);
                                    stopListening();
                                    setAttendanceMsg({ type: 'success', text: `Captured signal: ${token}` });
                                    resolve(token);
                                    return;
                                }
                            }
                            sampleCount = 0;
                        }
                    }
                    animFrameRef.current = setTimeout(() => listen(), 50);
                };

                listen();

                // Timeout after 30 seconds if nothing captured
                setTimeout(() => {
                    if (isListening) {
                        stopListening();
                        resolve(null);
                    }
                }, 30000);

            } catch (e) {
                setAttendanceMsg({ type: 'error', text: 'Microphone access is required.' });
                resolve(null);
            }
        });
    };

    const stopListening = () => {
        if (animFrameRef.current) clearTimeout(animFrameRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close();
        }
        audioCtxRef.current = null;
        streamRef.current = null;
        analyserRef.current = null;
        setIsListening(false);
    };

    if (loading) return <div className="dashboard"><div className="loading-state"><div className="spinner"></div></div></div>;

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>My Dashboard</h1>
                <div className="header-actions">
                    <button className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('profile')}><FaUserCircle /> <span>Profile</span></button>
                    <button className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('attendance')}><FaCalendarCheck /> <span>Attendance</span></button>
                    <button className={`btn ${activeTab === 'leave' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('leave')}><FaUmbrellaBeach /> <span>Leave</span></button>
                </div>
            </div>

            {activeTab === 'profile' && (
                <div className="profile-section">
                    <div className="profile-card-large">
                        <div className="profile-header-section">
                            {profile?.profilePicture ? <img src={profile.profilePicture} alt="P" className="profile-avatar-lg" /> : <div className="profile-avatar-placeholder"><FaUserCircle /></div>}
                            <div className="profile-name-section"><h2>{profile?.name}</h2><span className="role-pill role-employee">{profile?.role}</span></div>
                        </div>
                        <div className="profile-details-grid">
                            <div className="detail-item"><FaEnvelope className="detail-icon" /><div><span className="detail-label">Email</span><span className="detail-value">{profile?.email}</span></div></div>
                            <div className="detail-item"><FaBuilding className="detail-icon" /><div><span className="detail-label">Department</span><span className="detail-value">{profile?.department}</span></div></div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'attendance' && (
                <>
                    <div className="attendance-card mark-card">
                        <div className="card-header"><FaCheck className="card-icon" /><h3>Mark My Attendance</h3></div>
                        <div className="mode-selector" style={{ padding: '0 20px 20px' }}>
                            <div className="mode-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                {VERIFICATION_MODES.map(mode => (
                                    <button
                                        key={mode.id}
                                        className={`mode-card ${attendanceMode === mode.id ? 'active' : ''}`}
                                        onClick={() => { setAttendanceMode(mode.id); setAttendanceMsg(null); }}
                                        style={{ padding: '15px 10px' }}
                                    >
                                        <span className="mode-card-icon">{mode.icon}</span>
                                        <span className="mode-card-label" style={{ fontSize: '0.9rem' }}>{mode.label}</span>
                                        <span className="mode-card-desc" style={{ fontSize: '0.7rem' }}>{mode.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mark-form">
                            <input type="text" placeholder="6-digit OTP" maxLength={6} value={otpInput} onChange={(e) => setOtpInput(e.target.value)} className="otp-input" />
                            {isListening && (
                                <div className="ultrasonic-listen-section" style={{ width: '100%', marginBottom: '15px' }}>
                                    <div className="listening-indicator" style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                                        <div className="listening-pulse"></div>
                                        <span style={{ fontWeight: '600', color: 'var(--accent)' }}>Listening {Math.round(listeningProgress)}%</span>
                                    </div>
                                </div>
                            )}
                            <button className="btn btn-primary" onClick={handleMarkAttendance} disabled={markingAttendance || !otpInput || otpInput.length < 6}>
                                {markingAttendance ? 'Marking...' : 'Submit'}
                            </button>
                        </div>
                        {attendanceMsg && <div className={`alert alert-${attendanceMsg.type}`}>{attendanceMsg.text}</div>}
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead><tr><th>Date</th><th>Status</th><th>Verified</th><th>Marked At</th></tr></thead>
                            <tbody>{attendance.map(a => (<tr key={a.id}><td>{a.date}</td><td><span className={`status-badge ${statusColors[a.status]}`}>{a.status}</span></td><td>{a.otpVerified ? '✅' : '❌'}</td><td>{a.markedAt ? new Date(a.markedAt).toLocaleTimeString() : '—'}</td></tr>))}</tbody>
                        </table>
                    </div>
                </>
            )}
            
            {activeTab === 'leave' && <div className="table-controls"><button className="btn btn-primary" onClick={() => setShowLeaveForm(true)}><FaPlus /> Apply for Leave</button></div>}
            {showLeaveForm && <LeaveForm onClose={() => setShowLeaveForm(false)} onSuccess={fetchData} />}
        </div>
    );
};

export default EmployeeDashboard;
