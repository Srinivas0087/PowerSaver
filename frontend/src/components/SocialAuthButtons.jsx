import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { createSocialNonce } from '../services/authService.js'
import { getErrorMessage } from '../services/api.js'

const scriptPromises = new Map()
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID
const appleRedirectUri = import.meta.env.VITE_APPLE_REDIRECT_URI

function getSocialErrorMessage(error, provider) {
  if (!error.response) {
    return error.isAxiosError
      ? getErrorMessage(error)
      : error.message || `${provider} sign-in failed. Please try again.`
  }

  const { data } = error.response
  if (typeof data === 'string' && data.trim()) return 'The sign-in provider rejected the request. Please try again.'
  if (data?.detail) return data.detail
  if (data?.non_field_errors) return data.non_field_errors.join(' ')

  const fieldMessages = Object.values(data || {}).flatMap((value) =>
    Array.isArray(value) ? value : [value],
  )
    .filter((value) => typeof value === 'string' && value.trim())
  if (fieldMessages.length) return fieldMessages.join(' ')

  return `${provider} sign-in failed. Please try again or use email.`
}

function loadScript(id, src, isLoaded) {
  if (isLoaded()) return Promise.resolve()
  if (scriptPromises.has(id)) return scriptPromises.get(id)

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.onload = resolve
    script.onerror = () => {
      script.remove()
      scriptPromises.delete(id)
      reject(new Error('Could not load the sign-in provider. Check your connection and try again.'))
    }
    document.head.appendChild(script)
  })
  scriptPromises.set(id, promise)
  return promise
}

function SocialAuthButtons({ mode }) {
  const { socialLogin } = useAuth()
  const navigate = useNavigate()
  const googleButton = useRef(null)
  const socialLoginRef = useRef(socialLogin)
  const navigateRef = useRef(navigate)
  const [challenges, setChallenges] = useState({})
  const [googleButtonReady, setGoogleButtonReady] = useState(false)
  const [message, setMessage] = useState('')
  const [loadingProvider, setLoadingProvider] = useState('')

  useEffect(() => {
    socialLoginRef.current = socialLogin
    navigateRef.current = navigate
  }, [socialLogin, navigate])

  const finishLogin = useCallback(async (provider, identityToken, state, fullName = '') => {
    setMessage('')
    setLoadingProvider(provider)
    try {
      await socialLoginRef.current(provider, identityToken, state, fullName, mode)
      navigateRef.current('/dashboard')
    } catch (error) {
      setMessage(getSocialErrorMessage(error, provider))
    } finally {
      setLoadingProvider('')
    }
  }, [mode])

  useEffect(() => {
    let cancelled = false
    let googleButtonObserver

    async function prepareGoogle() {
      if (!googleClientId) return
      try {
        const challenge = await createSocialNonce('google')
        await loadScript(
          'google-identity-services',
          'https://accounts.google.com/gsi/client',
          () => Boolean(window.google?.accounts?.id),
        )
        if (cancelled || !googleButton.current) return

        const buttonContainer = googleButton.current
        googleButtonObserver = new MutationObserver(() => {
          if (buttonContainer.querySelector('iframe')) {
            setGoogleButtonReady(true)
            googleButtonObserver.disconnect()
          }
        })
        googleButtonObserver.observe(buttonContainer, { childList: true, subtree: true })
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          nonce: challenge.nonce,
          callback: (response) => {
            if (!response.credential) {
              setMessage('Google did not return a sign-in credential. Please try again.')
              return
            }
            void finishLogin('google', response.credential, challenge.state)
          },
        })
        window.google.accounts.id.renderButton(buttonContainer, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: Math.floor(buttonContainer.getBoundingClientRect().width),
        })
        if (buttonContainer.querySelector('iframe')) {
          setGoogleButtonReady(true)
          googleButtonObserver.disconnect()
        }
        setChallenges((current) => ({ ...current, google: challenge }))
      } catch (error) {
        setMessage(getSocialErrorMessage(error, 'Google'))
      }
    }

    async function prepareApple() {
      if (!appleClientId) return
      try {
        const challenge = await createSocialNonce('apple')
        await loadScript(
          'apple-sign-in',
          'https://appleid.cdn-apple.com/appleauth/static/jsapi/1/en_US/appleid.auth.js',
          () => Boolean(window.AppleID?.auth),
        )
        if (!cancelled) {
          setChallenges((current) => ({ ...current, apple: challenge }))
        }
      } catch (error) {
        setMessage(getSocialErrorMessage(error, 'Apple'))
      }
    }

    prepareGoogle()
    prepareApple()
    return () => {
      cancelled = true
      googleButtonObserver?.disconnect()
    }
  }, [finishLogin])

  function handleGoogleClick() {
    if (!googleClientId) {
      setMessage('Google sign-in needs VITE_GOOGLE_CLIENT_ID in the frontend environment.')
      return
    }
    if (!challenges.google) {
      setMessage('Google sign-in is still loading. Please try again.')
      return
    }
    if (!window.google?.accounts?.id) {
      setMessage('Google sign-in could not load. Check your connection and try again.')
      return
    }
    window.google.accounts.id.prompt()
  }

  async function handleAppleClick() {
    if (!appleClientId) {
      setMessage('Apple sign-in needs VITE_APPLE_CLIENT_ID in the frontend environment.')
      return
    }
    if (!challenges.apple || !window.AppleID?.auth) {
      setMessage('Apple sign-in is still loading. Please try again.')
      return
    }

    setMessage('')
    try {
      window.AppleID.auth.init({
        clientId: appleClientId,
        scope: 'name email',
        redirectURI: appleRedirectUri || window.location.origin,
        state: challenges.apple.state,
        nonce: challenges.apple.nonce,
        usePopup: true,
      })
      const response = await window.AppleID.auth.signIn()
      const { id_token: identityToken, state } = response.authorization
      if (state !== challenges.apple.state) {
        throw new Error('Apple sign-in could not be verified. Please try again.')
      }
      const name = response.user?.name
      const fullName = name ? [name.firstName, name.lastName].filter(Boolean).join(' ') : ''
      await finishLogin('apple', identityToken, state, fullName)
    } catch (error) {
      setMessage(getSocialErrorMessage(error, 'Apple'))
    }
  }

  return (
    <div className="auth-social">
      <div className="auth-social-buttons">
        <div className="auth-google-slot">
          <div className="auth-google-button" ref={googleButton} hidden={!googleButtonReady}></div>
          {!googleButtonReady && (
            <button type="button" className="auth-social-button" onClick={handleGoogleClick}>
              <i className="bi bi-google" aria-hidden="true"></i>
              <span>Continue with Google</span>
            </button>
          )}
        </div>
        <button
          type="button"
          className="auth-social-button auth-social-apple"
          onClick={handleAppleClick}
          disabled={loadingProvider === 'apple'}
        >
          <i className="bi bi-apple" aria-hidden="true"></i>
          <span>{loadingProvider === 'apple' ? 'Connecting...' : 'Continue with Apple'}</span>
        </button>
      </div>
      {message && <p className="auth-social-message" role="status">{message}</p>}
      <div className="auth-divider"><span>or continue with email</span></div>
    </div>
  )
}

export default SocialAuthButtons
