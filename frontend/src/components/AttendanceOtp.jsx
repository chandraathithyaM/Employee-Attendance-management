import { useState } from 'react';
import { FaKey, FaQrcode, FaClock } from 'react-icons/fa';
import { generateOtp, generateQrCode } from '../services/api';

const AttendanceOtp = () => {
    const [activeMode, setActiveMode] = useState('otp'); // 'otp' | 'qr'
    const [otp, setOtp] = useState(null);
    const [otpExpiry, setOtpExpiry] = useState(null);
    const [qrCodeData, setQrCodeData] = useState(null);
    const [qrOtp, setQrOtp] = useState(null);
    const [qrExpiry, setQrExpiry] = useState(null);
    const [message, setMessage] = useState(null);
    const [generating, setGenerating] = useState(false);

    const handleGenerateOtp = async () => {
        setGenerating(true);
        setMessage(null);
        
        if (!navigator.geolocation) {
            setMessage({ type: 'error', text: 'Geolocation is not supported by your browser' });
            setGenerating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const res = await generateOtp({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
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
            }
        );
    };

    const handleGenerateQr = async () => {
        setGenerating(true);
        setMessage(null);

        if (!navigator.geolocation) {
            setMessage({ type: 'error', text: 'Geolocation is not supported by your browser' });
            setGenerating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const res = await generateQrCode({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                    setQrCodeData(res.data.qrCode);
                    setQrOtp(res.data.otp);
                    setQrExpiry(res.data.expiresAt);
                } catch (err) {
                    setMessage({ type: 'error', text: 'Failed to generate QR code' });
                } finally {
                    setGenerating(false);
                }
            },
            (error) => {
                setMessage({ type: 'error', text: 'Please allow location access to generate QR code' });
                setGenerating(false);
            }
        );
    };


    return (
        <div className="attendance-section">
            {/* Mode Switch */}
            <div className="filter-tabs" style={{ marginBottom: 20 }}>
                <button
                    className={`filter-tab ${activeMode === 'otp' ? 'active' : ''}`}
                    onClick={() => setActiveMode('otp')}
                >
                    <FaKey style={{ marginRight: 6 }} /> OTP Mode
                </button>
                <button
                    className={`filter-tab ${activeMode === 'qr' ? 'active' : ''}`}
                    onClick={() => setActiveMode('qr')}
                >
                    <FaQrcode style={{ marginRight: 6 }} /> QR Code Mode
                </button>
            </div>

            <div className="attendance-grid">
                {/* OTP / QR Generation Card */}
                <div className="attendance-card otp-card">
                    {activeMode === 'otp' ? (
                        <>
                            <div className="card-header">
                                <FaKey className="card-icon" />
                                <h3>Generate OTP</h3>
                            </div>
                            <p className="card-desc">Generate a one-time password for attendance verification</p>
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleGenerateOtp}
                                disabled={generating}
                            >
                                {generating ? <><div className="spinner-sm"></div> Generating...</> : <><FaKey /> Generate New OTP</>}
                            </button>
                            {otp && (
                                <div className="otp-display">
                                    <span className="otp-label">Current OTP</span>
                                    <span className="otp-code">{otp}</span>
                                    <span className="otp-expiry">
                                        <FaClock /> Expires: {new Date(otpExpiry).toLocaleTimeString()}
                                    </span>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="card-header">
                                <FaQrcode className="card-icon" />
                                <h3>Generate QR Code</h3>
                            </div>
                            <p className="card-desc">Generate a scannable QR code for attendance</p>
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleGenerateQr}
                                disabled={generating}
                            >
                                {generating ? <><div className="spinner-sm"></div> Generating...</> : <><FaQrcode /> Generate QR Code</>}
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
                                    <span className="otp-label" style={{ marginTop: 6 }}>OTP inside: <strong>{qrOtp}</strong></span>
                                    <span className="otp-expiry">
                                        <FaClock /> Expires: {new Date(qrExpiry).toLocaleTimeString()}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>

            </div>

            {message && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                </div>
            )}
        </div>
    );
};

export default AttendanceOtp;
