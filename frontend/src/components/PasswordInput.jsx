import { useState } from 'react'

function PasswordInput({ id, name, value, onChange, error, placeholder }) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <div className="input-group">
        <input
          type={visible ? 'text' : 'password'}
          className={`form-control ${error ? 'is-invalid' : ''}`}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="off"
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          <i className={`bi ${visible ? 'bi-eye-slash' : 'bi-eye'}`}></i>
        </button>
        {error && <div className="invalid-feedback">{error}</div>}
      </div>
    </div>
  )
}

export default PasswordInput