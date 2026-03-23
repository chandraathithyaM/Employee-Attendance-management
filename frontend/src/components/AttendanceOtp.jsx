import { useState, useRef, useCallback, useEffect } from 'react';
import { FaKey, FaQrcode, FaClock, FaMapMarkerAlt, FaWifi, FaVolumeUp, FaStop } from 'react-icons/fa';
import { generateOtp, generateQrCode } from '../services/api';

// ── Ultrasonic Encoder (Updated Range: 16.5–18.5 kHz) ───────────────────────
const ULTRASONIC_BASE_FREQ = 16500;
const ULTRASONIC_FREQ_STEP = 50; 
const ULTRASONIC_BIT_DURATION = 0.15; // seconds per character

function encodeTokenToAudio(audioCtx, token) {
    const sampleRate = audioCtx.sampleRate;
    const totalDuration = token.length * ULTRASONIC_BIT_DURATION;
    const totalSamples = Math.ceil(sampleRate * totalDuration);
    const buffer = audioCtx.createBuffer(1, totalSamples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < token.length; i++) {
        const charCode = token.charCodeAt(i);
        const freq = ULTRASONIC_BASE_FREQ + (charCode % 40) * ULTRASONIC_FREQ_STEP;
        const startSample = Math.floor(i * ULTRASONIC_BIT_DURATION * sampleRate);
        const endSample = Math.floor((i + 1) * ULTRASONIC_BIT_DURATION * sampleRate);

        for (let s = startSample; s < endSample && s < totalSamples; s++) {
            const t = s / sampleRate;
            data[s] = 0.5 * Math.sin(2 * Math.PI * freq * t);
        }
    }
    return buffer;
}

const VERIFICATION_MODES = [
    { id: 'LOCATION', label: 'Location', icon: <FaMapMarkerAlt />, desc: 'GPS-based proximity check (50m radius)' },
    { id: 'WIFI', label: 'WiFi', icon: <FaWifi />, desc: 'Automatic network verification (Same Public IP)' },
    { id: 'ULTRASONIC', label: 'Ultrasonic', icon: <FaVolumeUp />, desc: 'Sound-based physical presence verification' },
];

const AttendanceOtp = () => {
    const [activeGenMode, setActiveGenMode] = useState('otp'); // 'otp' | 'qr'
    const [verificationMode, setVerificationMode] = useState('LOCATION');
    const [otp, setOtp] = useState(null);
    const [otpExpiry, setOtpExpiry] = useState(null);
    const [qrCodeData, setQrCodeData] = useState(null);
    const [qrOtp, setQrOtp] = useState(null);
    const [qrExpiry, setQrExpiry] = useState(null);
    const [message, setMessage] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [ultrasonicToken, setUltrasonicToken] = useState(null);
    const [isPlayingUltrasonic, setIsPlayingUltrasonic] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    const audioCtxRef = useRef(null);
    const audioSourceRef = useRef(null);
    const timerRef = useRef(null);

    // Auto-stop sound and clear OTP after 30 seconds
    useEffect(() => {
        if (timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && (otp || qrCodeData)) {
            // Signal expired
            stopUltrasonicSignal();
            setOtp(null);
            setQrCodeData(null);
            setUltrasonicToken(null);
            setMessage({ type: 'info', text: 'Attendance session expired (30s limit reached).' });
        }
        return () => clearTimeout(timerRef.current);
    }, [timeLeft, otp, qrCodeData]);

       navigator.geolocation.getCurrentPosition(
    async (position) => {
        try {
            const { latitude, longitude, accuracy } = position.coords;

            console.log("Manager location:", latitude, longitude, "Accuracy:", accuracy);

            if (accuracy > 100) {
                setMessage({
                    type: 'error',
                    text: 'Location accuracy too low. Please enable GPS.'
                });
                setGenerating(false);
                return;
            }

            const res = await generateOtp({
                latitude,
                longitude
            });

            setOtp(res.data.otp);
            setOtpExpiry(res.data.expiresAt);

        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to generate OTP' });
        } finally {
            setGenerating(false);
        }
    },
    (error) => {
        setMessage({ type: 'error', text: 'Please allow location access to generate OTP' });
        setGenerating(false);
    },
    {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
    }
);
    };

    const handleGenerate = async (type) => {
        setGenerating(true);
        setMessage(null);
        stopUltrasonicSignal(); // reset sound

        try {
            let position = null;
            if (verificationMode === 'LOCATION') {
                position = await getLocation();
            }

            const payload = buildPayload(position);
            let res;
            if (type === 'otp') {
                res = await generateOtp(payload);
                setOtp(res.data.otp);
                setOtpExpiry(res.data.expiresAt);
            } else {
                res = await generateQrCode(payload);
                setQrCodeData(res.data.qrCode);
                setQrOtp(res.data.otp);
                setQrExpiry(res.data.expiresAt);
            }

            setTimeLeft(30); // 30 seconds timer

            if (res.data.ultrasonicToken) {
                setUltrasonicToken(res.data.ultrasonicToken);
                // Automatically play ultrasonic signal if in ultrasonic mode
                if (verificationMode === 'ULTRASONIC') {
                    // Small delay to ensure state is set
                    setTimeout(() => playUltrasonicSignal(res.data.ultrasonicToken), 100);
                }
            }

            setMessage({ type: 'success', text: `${type === 'otp' ? 'OTP' : 'QR Code'} generated successfully!` });
        } catch (err) {
            const errMsg = err.message || 'Failed to generate';
            setMessage({ type: 'error', text: errMsg.includes('location') || errMsg.includes('Geolocation')
                ? 'Please allow location access to generate OTP'
                : `Failed to generate ${type === 'otp' ? 'OTP' : 'QR code'}`
            });
        } finally {
            setGenerating(false);
        }
    };

    const playUltrasonicSignal = (tokenOverride) => {
        const tokenToPlay = tokenOverride || ultrasonicToken;
        if (!tokenToPlay) return;
        
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            audioCtxRef.current = ctx;
            const buffer = encodeTokenToAudio(ctx, tokenToPlay);

            const playLoop = () => {
                if (!audioCtxRef.current) return;
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.onended = () => {
                    if (audioCtxRef.current) {
                        setTimeout(playLoop, 500);
                    }
                };
                source.start();
                audioSourceRef.current = source;
            };

            playLoop();
            setIsPlayingUltrasonic(true);
        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: 'Failed to play ultrasonic signal' });
        }
    };

    const stopUltrasonicSignal = () => {
        try {
            if (audioSourceRef.current) {
                audioSourceRef.current.onended = null;
                audioSourceRef.current.stop();
            }
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
            }
        } catch (e) { /* ignore */ }
        audioCtxRef.current = null;
        audioSourceRef.current = null;
        setIsPlayingUltrasonic(false);
    };

    return (
        <div className="attendance-section">
            <div className="mode-selector">
                <h3 className="mode-selector-title">Verification Method</h3>
                <div className="mode-cards">
                    {VERIFICATION_MODES.map(mode => (
                        <button
                            key={mode.id}
                            className={`mode-card ${verificationMode === mode.id ? 'active' : ''}`}
                            onClick={() => { setVerificationMode(mode.id); setMessage(null); setOtp(null); setQrCodeData(null); }}
                        >
                            <span className="mode-card-icon">{mode.icon}</span>
                            <span className="mode-card-label">{mode.label}</span>
                            <span className="mode-card-desc">{mode.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {verificationMode === 'WIFI' && (
                <div className="wifi-info-section" style={{ marginBottom: 20, padding: 15, background: 'rgba(99, 102, 241, 0.05)', borderRadius: 12, border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent)' }}>
                        <FaWifi /> <strong>Automatic WiFi Verification</strong>
                    </div>
                    <p style={{ fontSize: 13, margin: '8px 0 0', color: 'var(--text-secondary)' }}>
                        No manual entry needed! System will automatically verify that both you and the employee are connected to the same local network using IP matching.
                    </p>
                </div>
            )}

            <div className="filter-tabs" style={{ marginBottom: 20 }}>
                <button
                    className={`filter-tab ${activeGenMode === 'otp' ? 'active' : ''}`}
                    onClick={() => setActiveGenMode('otp')}
                >
                    <FaKey style={{ marginRight: 6 }} /> OTP Mode
                </button>
                <button
                    className={`filter-tab ${activeGenMode === 'qr' ? 'active' : ''}`}
                    onClick={() => setActiveGenMode('qr')}
                >
                    <FaQrcode style={{ marginRight: 6 }} /> QR Code Mode
                </button>
            </div>

            <div className="attendance-grid">
                <div className="attendance-card otp-card" style={{ border: timeLeft > 0 ? '2px solid var(--accent)' : '1px solid var(--border)' }}>
                    {activeGenMode === 'otp' ? (
                        <>
                            <div className="card-header">
                                <FaKey className="card-icon" />
                                <h3>Generate OTP</h3>
                            </div>
                            <p className="card-desc">
                                Valid for 30 seconds only. Once generated, nearby device will attempt to capture the verification token.
                            </p>
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={() => handleGenerate('otp')}
                                disabled={generating}
                            >
                                {generating ? <><div className="spinner-sm"></div> Generating...</> : <><FaKey /> {otp ? 'Regenerate OTP' : 'Generate New OTP'}</>}
                            </button>
                            {otp && (
                                <div className="otp-display">
                                    <span className="otp-label">Current OTP</span>
                                    <span className="otp-code">{otp}</span>
                                    <div className={`countdown-timer ${timeLeft < 10 ? 'urgent' : ''}`}>
                                        <FaClock /> <strong>{timeLeft}s</strong> remaining
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="card-header">
                                <FaQrcode className="card-icon" />
                                <h3>Generate QR Code</h3>
                            </div>
                            <p className="card-desc">
                                Valid for 30 seconds. Scan this QR code to mark attendance.
                            </p>
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={() => handleGenerate('qr')}
                                disabled={generating}
                            >
                                {generating ? <><div className="spinner-sm"></div> Generating...</> : <><FaQrcode /> {qrCodeData ? 'Regenerate QR' : 'Generate QR Code'}</>}
                            </button>
                            {qrCodeData && (
                                <div className="otp-display" style={{ textAlign: 'center' }}>
                                    <span className="otp-label">Scan this QR Code</span>
                                    <img
                                        src={qrCodeData}
                                        alt="Attendance QR Code"
                                        style={{
                                            width: 180, height: 180,
                                            border: '4px solid var(--primary, #6366f1)',
                                            borderRadius: 12,
                                            marginTop: 8,
                                            display: 'block',
                                            margin: '8px auto'
                                        }}
                                    />
                                    <div className={`countdown-timer ${timeLeft < 10 ? 'urgent' : ''}`} style={{ marginTop: 10 }}>
                                        <FaClock /> <strong>{timeLeft}s</strong> remaining
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {verificationMode === 'ULTRASONIC' && ultrasonicToken && (
                <div className="ultrasonic-section">
                    <div className="card-header">
                        <FaVolumeUp className="card-icon" />
                        <h3>Ultrasonic Signal (16.5-18.5 kHz)</h3>
                    </div>
                    <p className="card-desc">
                        Broadcasting secure token. This will automatically stop when the 30s timer expires.
                    </p>
                    <div className="ultrasonic-token-display">
                        <span className="ultrasonic-token-label">Token</span>
                        <span className="ultrasonic-token-value">{ultrasonicToken}</span>
                    </div>
                    {isPlayingUltrasonic ? (
                        <div className="ultrasonic-visualizer">
                            <div className="sound-wave">
                                <span className="wave-bar"></span>
                                <span className="wave-bar"></span>
                                <span className="wave-bar"></span>
                                <span className="wave-bar"></span>
                                <span className="wave-bar"></span>
                                <span className="wave-bar"></span>
                                <span className="wave-bar"></span>
                            </div>
                            <p className="ultrasonic-status">Automatically broadcasting... {timeLeft}s left</p>
                        </div>
                    ) : (
                        <button className="btn btn-primary btn-lg" onClick={() => playUltrasonicSignal()}>
                             <FaVolumeUp /> Resume Signal
                        </button>
                    )}
                </div>
            )}

            {message && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                </div>
            )}
        </div>
    );
};

export default AttendanceOtp;
