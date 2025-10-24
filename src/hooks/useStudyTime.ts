import { useState, useEffect, useRef } from 'react';

export const useStudyTime = () => {
  const [studyTime, setStudyTime] = useState(0); // tempo total em minutos
  const [isActive, setIsActive] = useState(true);
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      if (!isActive) {
        setIsActive(true);
      }
    };

    // Eventos que indicam atividade do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [isActive]);

  useEffect(() => {
    // Verifica inatividade a cada 30 segundos
    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      
      // Se passou 10 minutos (600000ms) sem atividade, pausa a contagem
      if (timeSinceLastActivity > 600000 && isActive) {
        setIsActive(false);
      }
    };

    const inactivityInterval = setInterval(checkInactivity, 30000);
    return () => clearInterval(inactivityInterval);
  }, [isActive]);

  useEffect(() => {
    // Contagem do tempo de estudo apenas quando ativo
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setStudyTime(prev => prev + 1);
      }, 60000); // incrementa a cada minuto
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return {
    studyTime,
    formattedTime: formatTime(studyTime),
    isActive
  };
};