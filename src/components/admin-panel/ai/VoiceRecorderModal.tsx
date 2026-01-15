import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, Square, AlertCircle } from 'lucide-react';
import { adminAIService } from '../../../api/services/admin-ai.service';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptReady: (transcript: string) => void;
}

/**
 * Voice Recorder Modal Component
 * Records audio and transcribes it using Whisper API
 */
export default function VoiceRecorderModal({
  isOpen,
  onClose,
  onTranscriptReady
}: VoiceRecorderModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasSpoken, setHasSpoken] = useState(false); // Track if user has spoken
  const [peakAudioLevel, setPeakAudioLevel] = useState(0); // Track peak audio level during recording

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const durationRef = useRef(0); // Track duration in ref for callbacks
  const hasSpokenRef = useRef(false); // Track speech detection in ref

  // Constants for voice detection
  const MIN_RECORDING_DURATION = 1; // Minimum 1 second of recording
  const MIN_AUDIO_LEVEL_THRESHOLD = 0.15; // Minimum audio level to consider as speech
  const MAX_RECORDING_DURATION = 60; // Maximum recording duration in seconds
  const SILENCE_TIMEOUT = 10; // Auto-stop after 10 seconds of silence

  // Refs for silence detection
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (silenceTimerRef.current) {
        clearInterval(silenceTimerRef.current);
      }
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
      }
    };
  }, []);

  // Reset state when modal opens - DON'T auto-start recording
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setDuration(0);
      setError(null);
      setIsTranscribing(false);
      setHasSpoken(false);
      setPeakAudioLevel(0);
      // Don't auto-start - user must click to start recording
    } else {
      stopRecording();
    }
  }, [isOpen]);

  // Duration timer - sync with ref for callback access
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          durationRef.current = newDuration;
          return newDuration;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Sync hasSpoken state with ref
  useEffect(() => {
    hasSpokenRef.current = hasSpoken;
  }, [hasSpoken]);

  // Audio level visualization and speech detection
  const updateAudioLevel = useCallback(() => {
    if (analyserRef.current && isRecording) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average level
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const normalizedLevel = average / 255; // Normalize to 0-1
      setAudioLevel(normalizedLevel);

      // Track peak audio level and detect if user has spoken
      if (normalizedLevel > MIN_AUDIO_LEVEL_THRESHOLD) {
        setHasSpoken(true);
        setPeakAudioLevel(prev => Math.max(prev, normalizedLevel));
        lastSpeechTimeRef.current = Date.now(); // Update last speech time
      }

      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording]);

  // Auto-stop after silence or max duration
  const checkAutoStop = useCallback(() => {
    if (!isRecording) return;

    const now = Date.now();
    const silenceDuration = (now - lastSpeechTimeRef.current) / 1000;

    // If user has spoken and then been silent for SILENCE_TIMEOUT seconds, auto-stop
    if (hasSpokenRef.current && silenceDuration >= SILENCE_TIMEOUT) {
      console.log('Auto-stopping due to silence');
      setError(`Recording stopped after ${SILENCE_TIMEOUT} seconds of silence.`);
      handleStopAndTranscribe();
    }
  }, [isRecording]);

  // Set up silence detection interval when recording starts
  useEffect(() => {
    if (isRecording) {
      lastSpeechTimeRef.current = Date.now();

      // Check for silence every second
      silenceTimerRef.current = setInterval(checkAutoStop, 1000);

      // Maximum recording duration timeout
      maxDurationTimerRef.current = setTimeout(() => {
        if (isRecording) {
          console.log('Auto-stopping due to max duration');
          setError(`Maximum recording time of ${MAX_RECORDING_DURATION} seconds reached.`);
          handleStopAndTranscribe();
        }
      }, MAX_RECORDING_DURATION * 1000);
    } else {
      // Clear timers when recording stops
      if (silenceTimerRef.current) {
        clearInterval(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }
    }

    return () => {
      if (silenceTimerRef.current) {
        clearInterval(silenceTimerRef.current);
      }
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
      }
    };
  }, [isRecording, checkAutoStop]);

  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      setHasSpoken(false);
      hasSpokenRef.current = false;
      setPeakAudioLevel(0);
      setDuration(0);
      durationRef.current = 0;

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      streamRef.current = stream;

      // Set up audio analyzer for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Determine the best supported MIME type
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
          }
        }
      }

      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm'
        });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);

      // Start audio level visualization
      updateAudioLevel();

    } catch (err: any) {
      console.error('Error starting recording:', err);
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError('Failed to start recording. Please try again.');
      }
    }
  };

  const stopRecording = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setAudioLevel(0);
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setError(null);

    try {
      // Convert blob to base64
      const base64Audio = await adminAIService.blobToBase64(audioBlob);

      // Determine audio format from blob type
      let audioFormat = 'webm';
      if (audioBlob.type.includes('mp4')) {
        audioFormat = 'mp4';
      } else if (audioBlob.type.includes('ogg')) {
        audioFormat = 'ogg';
      }

      // Send to Whisper API
      const result = await adminAIService.transcribeAudio({
        audio_base64: base64Audio,
        audio_format: audioFormat
      });

      if (result.success && result.text) {
        setTranscript(result.text);
      } else {
        setError(result.message || result.error || 'Transcription failed');
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError('Failed to transcribe audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleStopAndTranscribe = () => {
    if (isRecording) {
      // Check if recording is valid before transcribing
      if (durationRef.current < MIN_RECORDING_DURATION) {
        setError('Recording too short. Please speak for at least 1 second.');
        stopRecordingWithoutTranscribe();
        return;
      }

      if (!hasSpokenRef.current && peakAudioLevel < MIN_AUDIO_LEVEL_THRESHOLD) {
        setError('No speech detected. Please speak clearly into your microphone.');
        stopRecordingWithoutTranscribe();
        return;
      }

      stopRecording();
    }
  };

  // Stop recording without triggering transcription
  const stopRecordingWithoutTranscribe = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop media recorder without triggering onstop handler
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null; // Remove the handler
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setAudioLevel(0);
    audioChunksRef.current = [];
  };

  const handleDone = () => {
    if (transcript) {
      onTranscriptReady(transcript);
      // Don't call onClose() here - handleVoiceInput already closes the modal
      // Calling onClose would trigger toggleListening which would reopen the modal
    } else {
      onClose();
    }
  };

  const handleRetry = () => {
    setTranscript('');
    setError(null);
    setDuration(0);
    startRecording();
  };

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <h3 className="text-lg font-bold text-neutral-800">
              Voice Input
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Animated microphone */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                {/* Pulse rings based on audio level */}
                {isRecording && (
                  <>
                    <div
                      className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping"
                      style={{
                        animationDuration: '1.5s',
                        transform: `scale(${1 + audioLevel * 0.5})`
                      }}
                    />
                    <div
                      className="absolute inset-0 rounded-full bg-red-500 opacity-10 animate-ping"
                      style={{
                        animationDuration: '2s',
                        transform: `scale(${1 + audioLevel * 0.3})`
                      }}
                    />
                  </>
                )}

                {/* Microphone icon */}
                <button
                  onClick={isRecording ? handleStopAndTranscribe : handleRetry}
                  disabled={isTranscribing}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-xl hover:from-red-600 hover:to-red-700'
                      : isTranscribing
                      ? 'bg-gradient-to-br from-amber-400 to-amber-500 cursor-wait'
                      : 'bg-gradient-to-br from-neutral-400 to-neutral-500 hover:from-primary-500 hover:to-primary-600'
                  }`}
                >
                  {isRecording ? (
                    <Square className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className="w-10 h-10 text-white" />
                  )}
                </button>
              </div>

              {/* Status text */}
              <p className="mt-4 text-sm font-medium text-neutral-700">
                {isRecording
                  ? 'Recording... Click to stop'
                  : isTranscribing
                  ? 'Transcribing with Whisper AI...'
                  : transcript
                  ? 'Transcription complete'
                  : 'Click to start recording'}
              </p>

              {/* Duration */}
              <p className={`mt-1 text-2xl font-bold tabular-nums ${
                isRecording ? 'text-red-600' : 'text-neutral-400'
              }`}>
                {formatDuration(duration)}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Transcript */}
            <div className="min-h-[100px] p-4 bg-[#FAF8F6] border border-neutral-200 rounded-xl">
              {isTranscribing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-neutral-600">Processing audio...</p>
                </div>
              ) : transcript ? (
                <p className="text-sm text-neutral-800 leading-relaxed">
                  {transcript}
                </p>
              ) : (
                <p className="text-sm text-neutral-400 italic">
                  {error
                    ? 'Click the microphone to try again'
                    : 'Start speaking... Your voice will be transcribed here using Whisper AI'}
                </p>
              )}
            </div>

            {/* Wave animation */}
            {isRecording && (
              <div className="flex items-center justify-center gap-1 mt-4 h-8">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-red-500 to-red-400 rounded-full transition-all duration-100"
                    style={{
                      height: `${8 + audioLevel * 20 * Math.sin((Date.now() / 100) + i)}px`,
                      minHeight: '8px',
                      maxHeight: '28px'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 p-4 bg-[#FAF8F6] border-t border-neutral-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-[#FAF8F6] transition-colors"
            >
              Cancel
            </button>
            {transcript && !isRecording && !isTranscribing && (
              <button
                onClick={handleRetry}
                className="px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-[#FAF8F6] transition-colors"
              >
                Re-record
              </button>
            )}
            <button
              onClick={handleDone}
              disabled={!transcript || isRecording || isTranscribing}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                transcript && !isRecording && !isTranscribing
                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white hover:shadow'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
