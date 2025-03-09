import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick?: () => void;
}

const Button = ({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  disabled = false,
  onClick 
}: ButtonProps) => {
  const baseClasses = "font-medium py-2 px-4 rounded-md transition-colors";
  
  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90"
  };
  
  const disabledClasses = "opacity-50 cursor-not-allowed";
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? disabledClasses : ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;