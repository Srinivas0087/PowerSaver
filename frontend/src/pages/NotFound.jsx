import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="container py-5 text-center">
      <h1 className="display-3 fw-bold">404</h1>
      <p className="lead">Sorry, this page does not exist.</p>
      <Link to="/" className="btn btn-ps">
        Back to Home
      </Link>
    </div>
  )
}

export default NotFound