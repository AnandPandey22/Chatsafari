import React, { useState, useEffect, useRef, useMemo } from 'react';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  isFullDesktop: boolean;
  setIsFullDesktop: (v: boolean) => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callType: 'audio' | 'video';
  caller: any;
  callee: any;
  isIncoming: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onHangup: () => void;
}

const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  isMobile,
  isFullDesktop,
  setIsFullDesktop,
  localStream,
  remoteStream,
  callType,
  caller,
  callee,
  isIncoming,
  onAccept,
  onDecline,
  onHangup,
}) => {
  if (!isOpen) return null;

  // Color scheme (declare only once)
  const bgColor = 'bg-[#f3e8ff]'; // light violet
  const btnViolet = 'bg-violet-700 hover:bg-violet-800';
  const btnVioletInactive = 'bg-violet-300 hover:bg-violet-400 text-violet-700';
  const btnRed = 'bg-red-500 hover:bg-red-600';
  const textViolet = 'text-violet-700';

  // Mute and video toggle state (self-contained)
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Call timer state
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [callDuration, setCallDuration] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start timer when media is flowing (call accepted)
  useEffect(() => {
    // Only start timer when both local and remote streams are present (media is flowing)
    if (localStream && remoteStream) {
      if (!callStartTime) {
        setCallStartTime(Date.now());
      }
    } else {
      setCallStartTime(null);
      setCallDuration('');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [localStream, remoteStream]);

  // Update timer every second
  useEffect(() => {
    if (callStartTime) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        const min = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const sec = (elapsed % 60).toString().padStart(2, '0');
        setCallDuration(`${min}:${sec}`);
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [callStartTime]);

  // Effect to toggle local audio track
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  // Effect to toggle local video track
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff, localStream]);

  // Get display user (other side)
  const user = isIncoming ? caller : callee;
  const userName = user?.username || '';
  const userAvatar = user?.avatar || '';

  // Show timer if call is accepted, else show appropriate status text
  const showTimer = !!callStartTime;
  let statusDisplay = null;
  if (showTimer) {
    statusDisplay = <span className="text-2xl font-normal text-violet-700">{callDuration}</span>;
  } else if (isIncoming && onAccept && onDecline) {
    // Callee sees incoming call from caller (show caller's username, fallback to 'Unknown')
    const callerName = caller?.username || 'Unknown';
    statusDisplay = <span className="text-xl font-normal text-violet-700">Incoming call from {callerName}</span>;
  } else {
    // Caller sees 'Calling...'
    statusDisplay = <span className="text-3xl font-normal text-violet-700">Calling...</span>;
  }

  // Memoized video elements to prevent flicker
  const localVideoEl = useMemo(() => (
    <video
      className="w-[340px] h-[260px] bg-black rounded-xl border-2 border-violet-200 object-cover"
      autoPlay
      playsInline
      muted
      ref={video => {
        if (video && localStream) video.srcObject = localStream;
      }}
    />
  ), [localStream]);
  const remoteVideoEl = useMemo(() => (
    <video
      className="w-[340px] h-[260px] bg-gray-200 rounded-xl border-2 border-white object-cover"
      autoPlay
      playsInline
      ref={video => {
        if (video && remoteStream) video.srcObject = remoteStream;
      }}
    />
  ), [remoteStream]);
  // For maximize mode, larger video previews
  const localVideoElMax = useMemo(() => (
    <video
      className="w-[420px] h-[320px] bg-black rounded-xl border-2 border-violet-200 object-cover"
      autoPlay
      playsInline
      muted
      ref={video => {
        if (video && localStream) video.srcObject = localStream;
      }}
    />
  ), [localStream]);
  const remoteVideoElMax = useMemo(() => (
    <video
      className="w-[420px] h-[320px] bg-gray-200 rounded-xl border-2 border-white object-cover"
      autoPlay
      playsInline
      ref={video => {
        if (video && remoteStream) video.srcObject = remoteStream;
      }}
    />
  ), [remoteStream]);

  // Call status text
  let mobileStatusDisplay = '';
  if (isIncoming && onAccept && onDecline) mobileStatusDisplay = 'Incoming ' + (callType === 'video' ? 'video' : 'audio') + ' call...';
  else mobileStatusDisplay = callType === 'video' ? 'Video call' : 'Audio call';

  // Memoized video elements for mobile mode
  const localVideoElMobile = useMemo(() => (
    <video
      className="w-full h-full object-cover rounded-2xl"
      autoPlay
      playsInline
      muted
      ref={video => {
        if (video && localStream) video.srcObject = localStream;
      }}
    />
  ), [localStream]);
  const remoteVideoElMobile = useMemo(() => (
    <video
      className="w-full h-full object-cover rounded-2xl"
      autoPlay
      playsInline
      ref={video => {
        if (video && remoteStream) video.srcObject = remoteStream;
      }}
    />
  ), [remoteStream]);

  // Desktop (web) custom modal
  if (!isMobile && !isFullDesktop) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
        <div className={bgColor + " relative rounded-2xl shadow-2xl w-[900px] h-[600px] flex flex-col items-center p-0 overflow-hidden"}>
          {/* Top right maximize/minimize */}
          <button
            onClick={() => setIsFullDesktop(true)}
            className="absolute top-4 right-4 text-violet-400 hover:text-violet-700 text-2xl font-bold focus:outline-none"
            style={{ display: isFullDesktop ? 'none' : 'block' }}
            title="Maximize"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6M4 4v6m0-6l6 6M20 20h-6m6 0v-6m0 6l-6-6" />
            </svg>
          </button>
          <button
            onClick={() => setIsFullDesktop(false)}
            className="absolute top-4 right-4 text-violet-400 hover:text-violet-700 text-2xl font-bold focus:outline-none"
            style={{ display: isFullDesktop ? 'block' : 'none' }}
            title="Minimize"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 4v6m0-6h-6m6 6l-6-6M4 20v-6m0 6h6m-6-6l6 6" />
            </svg>
          </button>

          {/* Status/timer display */}
          <div className="flex flex-col items-center mt-8 mb-2">
            {statusDisplay}
          </div>

          {/* Video row - larger previews */}
          {callType === 'video' ? (
            <div className="flex flex-row items-center justify-between w-full flex-1 px-12 mt-2 mb-2">
              {/* Local video preview (left) */}
              <div className="flex-1 flex items-center justify-center">{localVideoEl}</div>
              {/* Remote video (right) */}
              <div className="flex-1 flex items-center justify-center">{remoteVideoEl}</div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full flex-1 h-full">
              <div className="w-[200px] h-[200px] rounded-full bg-violet-100 flex items-center justify-center shadow mx-auto">
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' className='w-40 h-40' fill='none'>
                  <rect x='22' y='14' width='20' height='36' rx='10' fill='none' stroke='#6D28D9' strokeWidth='4'/>
                  <rect x='30' y='50' width='4' height='8' rx='2' fill='#6D28D9'/>
                  <path d='M16 38v3a16 16 0 0032 0v-3' stroke='#6D28D9' strokeWidth='4' fill='none'/>
                </svg>
              </div>
              {/* Attach remote audio stream */}
              <audio
                autoPlay
                ref={audio => {
                  if (audio && remoteStream) audio.srcObject = remoteStream;
                }}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Controls row */}
          <div className="flex flex-row items-center justify-center w-full space-x-10 mb-8 mt-2">
            {isIncoming && onAccept && onDecline ? (
              <>
                <button onClick={onAccept} className={btnViolet + " text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg focus:outline-none"}>
                  ✓
                </button>
                <button onClick={onDecline} className={btnRed + " text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg focus:outline-none"}>
                  ✕
                </button>
              </>
            ) : (
              <>
                {/* Mute (left) */}
                <button
                  className={(isMuted ? btnVioletInactive : btnViolet) + " text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow focus:outline-none"}
                  title={isMuted ? 'Unmute' : 'Mute'}
                  onClick={() => setIsMuted(m => !m)}
                >
                  {isMuted ? (
                    // Mic off icon with larger/thicker slash
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19v2m0 0a7 7 0 01-7-7h2a5 5 0 0010 0h2a7 7 0 01-7 7zm0-7a3 3 0 003-3V5a3 3 0 00-6 0v4a3 3 0 003 3z" />
                      <line x1="2" y1="22" x2="22" y2="2" stroke="currentColor" strokeWidth="3" />
                    </svg>
                  ) : (
                    // Normal mic icon
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19v2m0 0a7 7 0 01-7-7h2a5 5 0 0010 0h2a7 7 0 01-7 7zm0-7a3 3 0 003-3V5a3 3 0 00-6 0v4a3 3 0 003 3z" />
                    </svg>
                  )}
                </button>
                {/* End call (center) - phone-off icon */}
                <button onClick={onHangup} className="bg-red-600 hover:bg-red-700 text-white w-16 h-16 rounded-full flex items-center justify-center focus:outline-none mx-4 transition-colors duration-150">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" className="w-10 h-10">
                    <path d="M12 26c4-3 12-3 16 0" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </button>
                {/* Video toggle (right) */}
                {callType === 'video' && (
                <button
                    className={(isVideoOff ? btnVioletInactive : btnViolet) + " text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow focus:outline-none"}
                  title={isVideoOff ? 'Enable Video' : 'Disable Video'}
                  onClick={() => setIsVideoOff(v => !v)}
                >
                  {isVideoOff ? (
                      // Video off icon with larger/thicker slash
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
                        <line x1="2" y1="22" x2="22" y2="2" stroke="currentColor" strokeWidth="3" />
                    </svg>
                  ) : (
                      // Normal video icon
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
                    </svg>
                  )}
                </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Maximize (full desktop) mode: same as web, but both videos at same level, larger
  if (!isMobile && isFullDesktop) {
    return (
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${bgColor}`}>
        <div className={`relative rounded-2xl shadow-2xl w-full h-full flex flex-col items-center p-0 overflow-hidden ${bgColor}`}>
          {/* Top right minimize */}
          <button
            onClick={() => setIsFullDesktop(false)}
            className="absolute top-4 right-4 text-violet-400 hover:text-violet-700 text-2xl font-bold focus:outline-none"
            title="Minimize"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 4v6m0-6h-6m6 6l-6-6M4 20v-6m0 6h6m-6-6l6 6" />
            </svg>
          </button>

          {/* Status/timer display */}
          <div className="flex flex-col items-center mt-8 mb-2">
            {statusDisplay}
          </div>

          {/* Video row - both previews at same level, larger */}
          <div className="flex flex-row items-center justify-between w-full flex-1 px-24 mt-2 mb-2">
            {/* Local video preview (left) */}
            <div className="flex-1 flex items-center justify-center">
              {callType === 'video' ? (
                <>
                  <div className="flex-1 flex items-center justify-center">{localVideoElMax}</div>
                  <div className="flex-1 flex items-center justify-center">{remoteVideoElMax}</div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="w-[200px] h-[200px] rounded-full bg-violet-100 flex items-center justify-center shadow mx-auto">
                      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' className='w-40 h-40' fill='none'>
                        <rect x='22' y='14' width='20' height='36' rx='10' fill='none' stroke='#6D28D9' strokeWidth='4'/>
                        <rect x='30' y='50' width='4' height='8' rx='2' fill='#6D28D9'/>
                        <path d='M16 38v3a16 16 0 0032 0v-3' stroke='#6D28D9' strokeWidth='4' fill='none'/>
                      </svg>
                    </div>
                  </div>
                  {/* Attach remote audio stream in maximize mode */}
                  <audio
                    autoPlay
                    ref={audio => {
                      if (audio && remoteStream) audio.srcObject = remoteStream;
                    }}
                    style={{ display: 'none' }}
                  />
                </>
              )}
            </div>
          </div>

          {/* Controls row */}
          <div className="flex flex-row items-center justify-center w-full space-x-16 mb-16 mt-2">
            {isIncoming && onAccept && onDecline ? (
              <>
                <button onClick={onAccept} className={btnViolet + " text-white w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg focus:outline-none"}>
                  ✓
                </button>
                <button onClick={onDecline} className={btnRed + " text-white w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg focus:outline-none"}>
                  ✕
                </button>
              </>
            ) : (
              <>
                {/* Mute (left) */}
                <button
                  className={(isMuted ? btnVioletInactive : btnViolet) + " text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow focus:outline-none"}
                  title={isMuted ? 'Unmute' : 'Mute'}
                  onClick={() => setIsMuted(m => !m)}
                >
                  {isMuted ? (
                    // Mic off icon with larger/thicker slash
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19v2m0 0a7 7 0 01-7-7h2a5 5 0 0010 0h2a7 7 0 01-7 7zm0-7a3 3 0 003-3V5a3 3 0 00-6 0v4a3 3 0 003 3z" />
                      <line x1="2" y1="22" x2="22" y2="2" stroke="currentColor" strokeWidth="3" />
                    </svg>
                  ) : (
                    // Normal mic icon
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19v2m0 0a7 7 0 01-7-7h2a5 5 0 0010 0h2a7 7 0 01-7 7zm0-7a3 3 0 003-3V5a3 3 0 00-6 0v4a3 3 0 003 3z" />
                    </svg>
                  )}
                </button>
                {/* End call (center) - phone-off icon */}
                <button onClick={onHangup} className="bg-red-600 hover:bg-red-700 text-white w-20 h-20 rounded-full flex items-center justify-center focus:outline-none mx-6 transition-colors duration-150">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" className="w-10 h-10">
                    <path d="M12 26c4-3 12-3 16 0" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </button>
                {/* Video toggle (right) */}
                {callType === 'video' && (
                <button
                  className={(isVideoOff ? btnVioletInactive : btnViolet) + " text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow focus:outline-none"}
                  title={isVideoOff ? 'Enable Video' : 'Disable Video'}
                  onClick={() => setIsVideoOff(v => !v)}
                >
                  {isVideoOff ? (
                      // Video off icon with larger/thicker slash
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
                        <line x1="2" y1="22" x2="22" y2="2" stroke="currentColor" strokeWidth="3" />
                    </svg>
                  ) : (
                      // Normal video icon
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
                    </svg>
                  )}
                </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Responsive modal style
  const modalClass = isMobile
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center ' + bgColor
    : isFullDesktop
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center ' + bgColor
    : 'fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center';
  const contentClass = isMobile || isFullDesktop
    ? 'w-full h-full flex flex-col items-center justify-center'
    : 'bg-white rounded-2xl shadow-2xl w-[90vw] max-w-md h-[80vh] flex flex-col items-center justify-center relative ' + bgColor;

  // --- MOBILE MODAL ---
  if (isMobile) {
    return (
      <div className={modalClass}>
        <div className={contentClass + ' p-0 flex flex-col items-center w-full h-full relative'}>
          {/* Timer or Calling... */}
          <div className="w-full flex justify-center mt-0 mb-[-20px] p-0 leading-none text-base">
            {statusDisplay}
          </div>

          {/* Media section */}
          <div className="flex-1 w-full flex flex-col items-center justify-center">
            {callType === 'video' ? (
              <div className="flex flex-col w-full p-0 m-0">
                <div className="flex items-center justify-center w-full p-0 m-0 -mt-4">
                  {/* Remote (receiver) video preview on top, pulled up */}
                  {remoteVideoEl}
                </div>
                <div className="flex items-center justify-center w-full mt-[30px] p-0 m-0">
                  {/* Local (caller) video preview with 30px gap above */}
                  {localVideoEl}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full mt-12 mb-8">
                <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] rounded-full bg-violet-100 flex items-center justify-center shadow">
                  <div className="w-[200px] h-[200px] rounded-full bg-violet-100 flex items-center justify-center shadow mx-auto">
                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' className='w-40 h-40' fill='none'>
                      <rect x='22' y='14' width='20' height='36' rx='10' fill='none' stroke='#6D28D9' strokeWidth='4'/>
                      <rect x='30' y='50' width='4' height='8' rx='2' fill='#6D28D9'/>
                      <path d='M16 38v3a16 16 0 0032 0v-3' stroke='#6D28D9' strokeWidth='4' fill='none'/>
                    </svg>
                  </div>
                </div>
              </div>
            )}
            {/* Attach remote audio stream for audio calls */}
            {callType === 'audio' && (
              <audio
                autoPlay
                ref={audio => {
                  if (audio && remoteStream) audio.srcObject = remoteStream;
                }}
                style={{ display: 'none' }}
              />
            )}
          </div>

          {/* Controls row - fixed at bottom */}
          <div className="w-full flex flex-row items-center justify-center space-x-8 pb-8 pt-2 fixed bottom-0 left-0 bg-[#f3e8ff] z-10">
            {isIncoming && onAccept && onDecline && !callStartTime ? (
              <>
                <button onClick={onAccept} className={btnViolet + " text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg focus:outline-none"}>
                  ✓
                </button>
                <button onClick={onDecline} className={btnRed + " text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg focus:outline-none"}>
                  ✕
                </button>
              </>
            ) : (
              <>
                {/* Mute */}
                <button
                  className={(isMuted ? btnVioletInactive : btnViolet) + " text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow focus:outline-none"}
                  title={isMuted ? 'Unmute' : 'Mute'}
                  onClick={() => setIsMuted(m => !m)}
                >
                  {isMuted ? (
                    // Mic off icon with larger/thicker slash
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19v2m0 0a7 7 0 01-7-7h2a5 5 0 0010 0h2a7 7 0 01-7 7zm0-7a3 3 0 003-3V5a3 3 0 00-6 0v4a3 3 0 003 3z" />
                      <line x1="2" y1="22" x2="22" y2="2" stroke="currentColor" strokeWidth="3" />
                    </svg>
                  ) : (
                    // Normal mic icon
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19v2m0 0a7 7 0 01-7-7h2a5 5 0 0010 0h2a7 7 0 01-7 7zm0-7a3 3 0 003-3V5a3 3 0 00-6 0v4a3 3 0 003 3z" />
                    </svg>
                  )}
                </button>
                {/* Hangup */}
                <button onClick={onHangup} className="bg-red-600 hover:bg-red-700 text-white w-16 h-16 rounded-full flex items-center justify-center focus:outline-none transition-colors duration-150">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" className="w-10 h-10">
                    <path d="M12 26c4-3 12-3 16 0" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </button>
                {/* Video toggle */}
                {callType === 'video' && (
                  <button
                    className={(isVideoOff ? btnVioletInactive : btnViolet) + " text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow focus:outline-none"}
                    title={isVideoOff ? 'Enable Video' : 'Disable Video'}
                    onClick={() => setIsVideoOff(v => !v)}
                  >
                    {isVideoOff ? (
                      // Video off icon with larger/thicker slash
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
                        <line x1="2" y1="22" x2="22" y2="2" stroke="currentColor" strokeWidth="3" />
                      </svg>
                    ) : (
                      // Normal video icon
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-7 h-7">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
                      </svg>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={modalClass}>
      <div className={contentClass + ' p-0 sm:p-8 flex flex-col items-center w-full h-full'}>
        {/* Profile and status */}
        <div className="flex flex-col items-center mt-8 mb-4">
          <img
            src={userAvatar}
            alt={userName}
            className="w-24 h-24 rounded-full border-4 border-violet-200 shadow-md object-cover mb-2"
          />
          <div className={"font-semibold text-lg mt-2 " + textViolet}>{userName}</div>
          <div className="text-gray-500 text-sm mt-1">{mobileStatusDisplay}</div>
        </div>

        {/* Media section */}
        <div className="flex-1 w-full flex flex-col items-center justify-center">
          {callType === 'video' ? (
            <div className="relative flex flex-col items-center w-full h-full justify-center">
              <video
                className="w-64 h-48 sm:w-80 sm:h-60 bg-black rounded-2xl border-2 border-violet-200 shadow-lg object-cover"
                autoPlay
                playsInline
                muted
                ref={video => {
                  if (video && localStream) video.srcObject = localStream;
                }}
              />
              <video
                className="w-24 h-20 sm:w-32 sm:h-24 bg-gray-200 rounded-xl border-2 border-white shadow absolute bottom-4 right-4"
                autoPlay
                playsInline
                ref={video => {
                  if (video && remoteStream) video.srcObject = remoteStream;
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full mt-8 mb-8">
              <div className="w-28 h-28 rounded-full bg-violet-100 flex items-center justify-center mb-4 shadow">
                <div className="w-[200px] h-[200px] rounded-full bg-violet-100 flex items-center justify-center shadow mx-auto">
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' className='w-40 h-40' fill='none'>
                    <rect x='22' y='14' width='20' height='36' rx='10' fill='none' stroke='#6D28D9' strokeWidth='4'/>
                    <rect x='30' y='50' width='4' height='8' rx='2' fill='#6D28D9'/>
                    <path d='M16 38v3a16 16 0 0032 0v-3' stroke='#6D28D9' strokeWidth='4' fill='none'/>
                  </svg>
                </div>
              </div>
              <span className="text-violet-700 text-xl font-medium">Audio Call</span>
              {/* Attach remote audio stream */}
              <audio
                autoPlay
                ref={audio => {
                  if (audio && remoteStream) audio.srcObject = remoteStream;
                }}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="w-full flex items-center justify-center space-x-6 p-6 mt-auto mb-4">
          {isIncoming && onAccept && onDecline ? (
            <>
              <button onClick={onAccept} className={btnViolet + " text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg focus:outline-none"}>
                ✓
              </button>
              <button onClick={onDecline} className={btnRed + " text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg focus:outline-none"}>
                ✕
              </button>
            </>
          ) : (
            <>
              <button onClick={onHangup} className={btnRed + " text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg focus:outline-none"}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 15.25l-1.5 1.5m0 0l-1.5-1.5m1.5 1.5V12m12 3.25l1.5 1.5m0 0l1.5-1.5m-1.5 1.5V12" />
                </svg>
              </button>
              {/* Mute, etc. can be added here */}
              {/* Fullscreen toggle for desktop */}
              {!isMobile && !isFullDesktop && (
                <button onClick={() => setIsFullDesktop(true)} className={btnViolet + " text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg focus:outline-none"}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6M4 4v6m0-6l6 6M20 20h-6m6 0v-6m0 6l-6-6" />
                  </svg>
                </button>
              )}
              {!isMobile && isFullDesktop && (
                <button onClick={() => setIsFullDesktop(false)} className={btnViolet + " text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg focus:outline-none"}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 4v6m0-6h-6m6 6l-6-6M4 20v-6m0 6h6m-6-6l6 6" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
        {/* Close button for modal (top right, only on desktop) */}
        {!isMobile && !isFullDesktop && (
          <button onClick={onClose} className="absolute top-4 right-4 text-violet-400 hover:text-violet-700 text-2xl font-bold focus:outline-none">×</button>
        )}
      </div>
    </div>
  );
};

export default CallModal; 
