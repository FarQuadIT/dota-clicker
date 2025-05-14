// src/TestImages.tsx

export function TestImages() {
    // Массив с путями к различным типам ресурсов
    const testResources = [
      // Изображения магазина
      { path: '/media/shop/images/gold.png', name: 'Золото', type: 'image' },
      { path: '/media/shop/images/radiant_tower.png', name: 'Башня', type: 'image' },
      { path: '/media/shop/items/gauntlets_of_strength.jpg', name: 'Перчатки силы', type: 'image' },
      { path: '/media/shop/main/health.png', name: 'Иконка здоровья', type: 'image' },
      
      // Игровые ресурсы
      { path: '/media/game/images/coin.png', name: 'Монета', type: 'image' },
      { path: '/media/game/images/forest_background.png', name: 'Фон леса', type: 'image' },
      
      // Персонажи
      { path: '/media/game/assets/heroes/juggernaut_idle.png', name: 'Джаггернаут (покой)', type: 'image' },
      { path: '/media/game/assets/heroes/juggernaut_attack.png', name: 'Джаггернаут (атака)', type: 'image' },
      
      // Враги
      { path: '/media/game/assets/creeps/dire_creep_idle.png', name: 'Крип (покой)', type: 'image' },
      { path: '/media/game/assets/creeps/wolf_idle.png', name: 'Волк (покой)', type: 'image' },
      
      // Звуки (для проверки существования)
      { path: '/media/shop/sounds/buy.wav', name: 'Звук покупки', type: 'audio' },
      { path: '/media/game/sounds/heroes/juggernaut/attack/jugger_attack_0.mp3', name: 'Атака Джаггернаута', type: 'audio' },
    ];
  
    return (
      <div style={{ padding: '20px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
        <h1 style={{ color: 'white', textAlign: 'center' }}>Тест медиа-ресурсов</h1>
        
        {/* Изображения */}
        <h2 style={{ color: 'white' }}>Изображения</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '20px',
          marginBottom: '40px'
        }}>
          {testResources
            .filter(item => item.type === 'image')
            .map((img, index) => (
              <div key={index} style={{ 
                border: '1px solid #444', 
                padding: '10px',
                textAlign: 'center',
                backgroundColor: '#2a2a2a',
                borderRadius: '8px'
              }}>
                <p style={{ color: 'white', marginBottom: '10px' }}>{img.name}</p>
                <img 
                  src={img.path} 
                  alt={img.name}
                  style={{ 
                    maxWidth: '100%', 
                    height: '100px',
                    objectFit: 'contain',
                    display: 'block',
                    margin: '0 auto 10px'
                  }}
                  onError={(e) => {
                    console.error(`❌ Не удалось загрузить: ${img.path}`);
                    const target = e.target as HTMLImageElement;
                    target.style.border = '2px solid red';
                    target.alt = 'Ошибка загрузки';
                  }}
                  onLoad={() => {
                    console.log(`✅ Загружено: ${img.path}`);
                  }}
                />
                <small style={{ color: '#888', fontSize: '10px', wordBreak: 'break-all' }}>
                  {img.path}
                </small>
              </div>
            ))}
        </div>
  
        {/* Аудио файлы */}
        <h2 style={{ color: 'white' }}>Звуковые файлы</h2>
        <div style={{ marginBottom: '40px' }}>
          {testResources
            .filter(item => item.type === 'audio')
            .map((audio, index) => (
              <div key={index} style={{ 
                marginBottom: '10px',
                padding: '10px',
                border: '1px solid #444',
                backgroundColor: '#2a2a2a',
                borderRadius: '8px'
              }}>
                <p style={{ color: 'white', margin: '0 0 5px 0' }}>{audio.name}</p>
                <audio 
                  controls
                  style={{ width: '100%' }}
                  onError={() => {
                    console.error(`❌ Не удалось загрузить аудио: ${audio.path}`);
                  }}
                  onLoadedData={() => {
                    console.log(`✅ Аудио загружено: ${audio.path}`);
                  }}
                >
                  <source src={audio.path} type={audio.path.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav'} />
                  Ваш браузер не поддерживает аудио элемент.
                </audio>
                <small style={{ color: '#888', fontSize: '10px' }}>
                  {audio.path}
                </small>
              </div>
            ))}
        </div>
  
        {/* Общая статистика */}
        <div style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px', 
          backgroundColor: '#333', 
          padding: '15px',
          borderRadius: '8px',
          color: 'white'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Статистика загрузки</h3>
          <p style={{ margin: '5px 0' }}>Всего ресурсов: {testResources.length}</p>
          <p style={{ margin: '5px 0' }}>Изображений: {testResources.filter(r => r.type === 'image').length}</p>
          <p style={{ margin: '5px 0' }}>Аудио: {testResources.filter(r => r.type === 'audio').length}</p>
        </div>
      </div>
    );
  }