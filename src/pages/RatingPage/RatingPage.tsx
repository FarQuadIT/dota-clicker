// src/pages/RatingPage/RatingPage.tsx

export default function RatingPage() {
  return (
    <div style={{
      padding: '20px',
      color: 'white',
      textAlign: 'center',
      minHeight: 'calc(100vh - 90px)', // Учитываем header и footer
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ 
        marginBottom: '30px',
        fontSize: '2.5rem',
        background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        🏆 Рейтинг
      </h1>
      
      <div style={{
        maxWidth: '600px',
        padding: '30px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#4ecdc4' }}>
          Таблица лидеров
        </h2>
        
        <p style={{ 
          fontSize: '1.2rem', 
          lineHeight: '1.6',
          marginBottom: '20px',
          opacity: 0.9 
        }}>
          Здесь будет отображаться рейтинг игроков с их достижениями и статистикой.
        </p>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '30px'
        }}>
          <div style={{
            padding: '15px',
            background: 'rgba(255, 215, 0, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>🥇 1. Ваш герой</span>
            <span style={{ color: '#ffd700' }}>В разработке...</span>
          </div>
          
          <div style={{
            padding: '15px',
            background: 'rgba(192, 192, 192, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(192, 192, 192, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>🥈 2. Второе место</span>
            <span style={{ color: '#c0c0c0' }}>Скоро...</span>
          </div>
          
          <div style={{
            padding: '15px',
            background: 'rgba(205, 127, 50, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(205, 127, 50, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>🥉 3. Третье место</span>
            <span style={{ color: '#cd7f32' }}>Ожидает...</span>
          </div>
        </div>
      </div>
    </div>
  );
} 