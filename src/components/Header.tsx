import { useState } from 'react'

interface HeaderProps {
  cartItemCount?: number
}

export function Header({ cartItemCount = 0 }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">Flowo</h1>
        <div className="header-icons">
          <div className="icon-container">
            <img 
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/a043a339-118b-478c-bb91-04bb99314b5e" 
              alt="Search" 
              className="header-icon"
            />
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount}</span>
            )}
          </div>
          <img 
            src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/2c265731-b1c7-4dc4-9e36-ee34a030485e" 
            alt="Menu" 
            className="header-icon"
          />
        </div>
      </div>
    </header>
  )
}
