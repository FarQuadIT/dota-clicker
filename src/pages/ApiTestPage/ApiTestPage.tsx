// src/pages/ApiTestPage/ApiTestPage.tsx

import { useState } from 'react';
import { testApiConnection, pingServer, testPostRequest, testHeroStats, testHeroItems} from '../../shared/api/apiService';
import { API_BASE_URL } from '../../shared/constants';

export default function ApiTestPage() {
  const [status, setStatus] = useState<string>('Ожидание тестирования...');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<any>(null);
  const handleTestHeroStats = async () => {
    setIsLoading(true);
    setStatus('Загрузка характеристик героя...');
    try {
      const result = await testHeroStats();
      setTestResults(result);
      setStatus(result 
        ? '✅ Характеристики героя успешно загружены' 
        : '❌ Не удалось загрузить характеристики героя');
    } catch (error) {
      setStatus(`❌ Ошибка при загрузке характеристик героя: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      setTestResults({ error });
    } finally {
      setIsLoading(false);
    }
  };
  const handlePingServer = async () => {
    setIsLoading(true);
    setStatus('Проверка доступности сервера...');
    try {
      const result = await pingServer();
      setTestResults(result);
      setStatus(result.success 
        ? `✅ Сервер доступен (${result.status} ${result.statusText})` 
        : `❌ Сервер недоступен: ${result.error}`);
    } catch (error) {
      setStatus(`❌ Ошибка при проверке сервера: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      setTestResults({ error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestApi = async () => {
    setIsLoading(true);
    setStatus('Тестирование API...');
    try {
      const result = await testApiConnection();
      setTestResults(result);
      setStatus(result.success 
        ? '✅ API работает корректно' 
        : `❌ Ошибка API: ${result.error}`);
    } catch (error) {
      setStatus(`❌ Ошибка при тестировании API: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      setTestResults({ error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPost = async () => {
    setIsLoading(true);
    setStatus('Проверка POST запроса...');
    try {
      const result = await testPostRequest();
      setTestResults(result);
      setStatus(result.success 
        ? '✅ POST запрос отправлен успешно' 
        : `❌ Ошибка POST запроса: ${result.error}`);
    } catch (error) {
      setStatus(`❌ Ошибка при отправке POST запроса: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      setTestResults({ error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestHeroItems = async () => {
    setIsLoading(true);
    setStatus('Загрузка предметов героя...');
    try {
      const result = await testHeroItems();
      setTestResults(result);
      setStatus(result 
        ? '✅ Предметы героя успешно загружены' 
        : '❌ Не удалось загрузить предметы героя');
    } catch (error) {
      setStatus(`❌ Ошибка при загрузке предметов героя: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      setTestResults({ error });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px',
      color: 'white',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1>Тестирование API</h1>
      
      <div style={{ 
        background: 'rgba(0,0,0,0.2)', 
        padding: '10px', 
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h2>Конфигурация</h2>
        <p><strong>API URL:</strong> {API_BASE_URL}</p>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '10px',
        marginBottom: '20px'
      }}>
        <button 
          onClick={handlePingServer}
          disabled={isLoading}
          style={{
            padding: '10px 15px',
            background: '#1a1a1a',
            color: 'white',
            border: '1px solid #444',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          Пинг сервера
        </button>
        
        <button 
          onClick={handleTestApi}
          disabled={isLoading}
          style={{
            padding: '10px 15px',
            background: '#1a1a1a',
            color: 'white',
            border: '1px solid #444',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          Проверить GET запросы
        </button>
        
        <button 
          onClick={handleTestPost}
          disabled={isLoading}
          style={{
            padding: '10px 15px',
            background: '#1a1a1a',
            color: 'white',
            border: '1px solid #444',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          Проверить POST запрос
        </button>
        <button 
          onClick={handleTestHeroStats}
          disabled={isLoading}
          style={{
            padding: '10px 15px',
            background: '#1a1a1a',
            color: 'white',
            border: '1px solid #444',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          Загрузить героя
        </button>
        <button 
          onClick={handleTestHeroItems}
          disabled={isLoading}
          style={{
            padding: '10px 15px',
            background: '#1a1a1a',
            color: 'white',
            border: '1px solid #444',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
  Загрузить предметы
</button>
      </div>
      
      <div style={{ 
        background: 'rgba(0,0,0,0.2)', 
        padding: '10px', 
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h2>Статус</h2>
        <p style={{ color: status.includes('✅') ? '#77d87a' : status.includes('❌') ? '#ff6b6b' : 'white' }}>
          {status}
        </p>
      </div>
      
      {testResults && (
        <div style={{ 
          background: 'rgba(0,0,0,0.2)', 
          padding: '10px', 
          borderRadius: '4px'
        }}>
          <h2>Результаты</h2>
          <pre style={{ 
            overflow: 'auto', 
            backgroundColor: '#1a1a1a', 
            padding: '10px', 
            borderRadius: '4px',
            maxHeight: '400px'
          }}>
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}