import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface PhoneInputProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  required?: boolean;
}

// Common country codes for Nigeria and surrounding regions
const countryCodes = [
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+225', country: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: '+229', country: 'Benin', flag: '🇧🇯' },
  { code: '+227', country: 'Niger', flag: '🇳🇪' },
  { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+228', country: 'Togo', flag: '🇹🇬' },
  { code: '+237', country: 'Cameroon', flag: '🇨🇲' },
  { code: '+235', country: 'Chad', flag: '🇹🇩' },
  { code: '+236', country: 'Central African Republic', flag: '🇨🇫' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
];

export function PhoneInput({ 
  id, 
  label, 
  placeholder = "Enter phone number", 
  value = "", 
  onChange, 
  className = "",
  required = false 
}: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState('+234');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Parse the initial value to extract country code and phone number
  useEffect(() => {
    if (value) {
      // Find matching country code
      const matchedCode = countryCodes.find(cc => value.startsWith(cc.code));
      if (matchedCode) {
        setCountryCode(matchedCode.code);
        setPhoneNumber(value.substring(matchedCode.code.length).trim());
      } else {
        // Default to Nigeria if no country code found
        setCountryCode('+234');
        setPhoneNumber(value);
      }
    }
  }, [value]);

  // Update parent component when values change
  useEffect(() => {
    const fullNumber = phoneNumber ? `${countryCode} ${phoneNumber}` : '';
    onChange?.(fullNumber);
  }, [countryCode, phoneNumber, onChange]);

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Only allow numbers, spaces, and hyphens
    const sanitized = input.replace(/[^\d\s-]/g, '');
    setPhoneNumber(sanitized);
  };

  const handleCountryCodeChange = (code: string) => {
    setCountryCode(code);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="flex gap-2">
        <Select value={countryCode} onValueChange={handleCountryCodeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {countryCodes.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span className="text-sm">{country.code}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={id}
          type="tel"
          placeholder={placeholder}
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          className="flex-1"
          maxLength={15} // Reasonable limit for phone numbers
        />
      </div>
      {phoneNumber && (
        <p className="text-sm text-muted-foreground">
          Full number: {countryCode} {phoneNumber}
        </p>
      )}
    </div>
  );
}
