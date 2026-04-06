import { useState } from 'react'
import DeckGrid from './components/DeckGrid/DeckGrid'
import PackOpener from './components/PackOpener/PackOpener'
import GameTools from './components/GameTools/GameTools'
import './index.css'
import './App.css'

export default function App() {
  const [activeTab, setActiveTab] = useState('vault')

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="brand-diamond">❖</div>
            <div className="brand-text">
              <div className="brand-title">THE VAULT</div>
              <div className="brand-sub">TCG // COLLECTION SYSTEM v1.0</div>
            </div>
          </div>

          <nav className="header-nav">
            <button
              className={`nav-btn ${activeTab === 'vault' ? 'active' : ''}`}
              onClick={() => setActiveTab('vault')}
            >
              <span className="nav-index">01</span>
              <span className="nav-label">DECK VAULT</span>
            </button>
            <button
              className={`nav-btn ${activeTab === 'packs' ? 'active' : ''}`}
              onClick={() => setActiveTab('packs')}
            >
              <span className="nav-index">02</span>
              <span className="nav-label">PACK SIM</span>
            </button>
            <button
              className={`nav-btn ${activeTab === 'game' ? 'active' : ''}`}
              onClick={() => setActiveTab('game')}
            >
              <span className="nav-index">03</span>
              <span className="nav-label">GAME TOOLS</span>
            </button>
          </nav>

          <div className="header-status">
            <span className="status-dot" />
            <span className="status-text">SYSTEM ONLINE</span>
          </div>
        </div>
        <div className="header-scan" />
      </header>

      <main className="app-main">
        <div className="main-inner">
          {activeTab === 'vault' && <DeckGrid />}
          {activeTab === 'packs' && <PackOpener />}
          {activeTab === 'game' && <GameTools />}
        </div>
      </main>

      <footer className="app-footer">
        <span className="footer-item">THE VAULT</span>
        <span className="footer-sep">//</span>
        <span className="footer-item">CARD DATA: <a href="https://scryfall.com" target="_blank" rel="noreferrer">SCRYFALL API</a></span>
        <span className="footer-sep">//</span>
        <a className="footer-item" href="https://github.com/Arcaneweb555/the-vault" target="_blank" rel="noreferrer">GITHUB</a>
      </footer>
    </div>
  )
}