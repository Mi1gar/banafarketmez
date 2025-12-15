'use client';

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useUser } from '@/lib/userContext';

export const UsernameModal: React.FC = () => {
  const { username, setUsername, isUsernameSet } = useUser();
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedValue = inputValue.trim();

    if (!trimmedValue) {
      setError('Kullanıcı adı boş olamaz');
      return;
    }

    if (trimmedValue.length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalıdır');
      return;
    }

    if (trimmedValue.length > 20) {
      setError('Kullanıcı adı en fazla 20 karakter olabilir');
      return;
    }

    // Özel karakter kontrolü
    if (!/^[a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]+$/.test(trimmedValue)) {
      setError('Kullanıcı adı sadece harf, rakam ve boşluk içerebilir');
      return;
    }

    setUsername(trimmedValue);
    setInputValue('');
  };

  if (isUsernameSet) return null;

  return (
    <Modal isOpen={!isUsernameSet} onClose={() => {}} title="Hoş Geldiniz!">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Kullanıcı Adınızı Girin
          </label>
          <input
            id="username"
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError('');
            }}
            placeholder="Kullanıcı adınız (3-20 karakter)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            autoFocus
            maxLength={20}
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Bu isim oyunlarda görünecektir
          </p>
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="primary">
            Devam Et
          </Button>
        </div>
      </form>
    </Modal>
  );
};



