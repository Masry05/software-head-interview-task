// This file mixes TS and JS patterns badly on purpose
import React from 'react'
import { createRoot } from 'react-dom/client'
// @ts-ignore
import App from './messy.jsx'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  React.createElement(App)
)
