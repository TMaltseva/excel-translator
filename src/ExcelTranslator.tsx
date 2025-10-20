import React, { useState, useEffect, ChangeEvent } from 'react';
import styled from 'styled-components';
import { useTranslation } from './hooks/useTranslation';

const API_KEY_STORAGE_KEY = 'yandex_api_key';

export const ExcelTranslator = () => {
  const [apiKey, setApiKey] = useState('');
  const [saveKey, setSaveKey] = useState(false);
  const { status, progress, translateFile } = useTranslation();

  useEffect(() => {
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);

    if (savedKey) {
      setApiKey(savedKey);
      setSaveKey(true);
    }
  }, []);

  const handleApiKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const handleSaveKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSaveKey(e.target.checked);
  };

  const handleClearKey = () => {
    setApiKey('');
    setSaveKey(false);
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!apiKey.trim()) {
      alert('Пожалуйста, введите API ключ!');

      return;
    }

    if (saveKey) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }

    await translateFile(file, apiKey);

    e.target.value = '';
  };

  return (
    <Container>
      <Card>
        <Header>
          <Icon>🌐</Icon>
          <Title>Excel Переводчик</Title>
          <Subtitle>Армянский и Английский → Русский</Subtitle>
        </Header>

        <ApiHelp>
          <strong>Как получить API ключ:</strong>
          <br />
          1. Зайдите на{' '}
          <a
            href="https://cloud.yandex.ru/services/translate"
            target="_blank"
            rel="noopener noreferrer"
          >
            cloud.yandex.ru/services/translate
          </a>
          <br />
          2. Зарегистрируйтесь и создайте API ключ
          <br />
          3. Первые 1 млн символов/месяц — бесплатно!
        </ApiHelp>

        <FormGroup>
          <Label htmlFor="apiKey">Yandex API ключ:</Label>
          <InputWrapper>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={handleApiKeyChange}
              placeholder="Введите ваш API ключ"
            />
            {apiKey && (
              <ClearButton onClick={handleClearKey} type="button">
                ✕
              </ClearButton>
            )}
          </InputWrapper>
          <CheckboxWrapper>
            <Checkbox
              id="saveKey"
              type="checkbox"
              checked={saveKey}
              onChange={handleSaveKeyChange}
            />
            <CheckboxLabel htmlFor="saveKey">
              Сохранить ключ в браузере
            </CheckboxLabel>
          </CheckboxWrapper>
        </FormGroup>

        <FormGroup>
          <FileInputWrapper>
            <FileInput
              id="fileInput"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={status.type === 'processing'}
            />
            <FileLabel
              htmlFor="fileInput"
              disabled={status.type === 'processing'}
            >
              📁 Выбрать Excel файл
            </FileLabel>
          </FileInputWrapper>
        </FormGroup>

        {status.type === 'processing' && progress && (
          <StatusBox type="processing">
            <Spinner />
            <span>{progress.message}</span>
          </StatusBox>
        )}

        {status.type === 'success' && (
          <StatusBox type="success">{status.message}</StatusBox>
        )}

        {status.type === 'error' && (
          <StatusBox type="error">{status.message}</StatusBox>
        )}

        <Footer>Форматы: .xlsx, .xls • Гибридный перевод: Словарь + AI</Footer>
      </Card>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
`;

const Card = styled.div`
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
  max-width: 600px;
  width: 100%;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Icon = styled.div`
  font-size: 48px;
  margin-bottom: 10px;
`;

const Title = styled.h1`
  color: #333;
  margin: 0 0 10px 0;
  font-size: 28px;
`;

const Subtitle = styled.p`
  color: #666;
  margin: 0;
  font-size: 14px;
`;

const ApiHelp = styled.div`
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #856404;

  a {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  color: #333;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 15px;
  padding-right: 45px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: #e0e0e0;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #666;
  transition: background 0.3s;

  &:hover {
    background: #d0d0d0;
    color: #333;
  }
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`;

const Checkbox = styled.input`
  width: auto;
  margin: 0;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: 13px;
  color: #666;
  font-weight: normal;
  margin: 0;
  cursor: pointer;
`;

const FileInputWrapper = styled.div`
  position: relative;
`;

const FileInput = styled.input`
  position: absolute;
  left: -9999px;
`;

const FileLabel = styled.label<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px 25px;
  background: ${(props) => (props.disabled ? '#ccc' : '#667eea')};
  color: white;
  border-radius: 8px;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: background 0.3s;
  font-weight: 600;
  gap: 10px;

  &:hover {
    background: ${(props) => (props.disabled ? '#ccc' : '#5568d3')};
  }
`;

interface StatusBoxProps {
  type: 'processing' | 'success' | 'error';
}

const StatusBox = styled.div<StatusBoxProps>`
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;

  ${(props) => {
    switch (props.type) {
      case 'processing':
        return `
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        `;
      case 'success':
        return `
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        `;
      case 'error':
        return `
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        `;
      default:
        return '';
    }
  }}
`;

const Spinner = styled.div`
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const Footer = styled.div`
  text-align: center;
  color: #999;
  font-size: 12px;
  margin-top: 20px;
`;
