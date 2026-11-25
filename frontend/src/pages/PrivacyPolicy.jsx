function PrivacyPolicy() {
  return (
    <article className="container py-5">
      <div className="mx-auto" style={{ maxWidth: '900px' }}>
        <h1 className="fw-bold mb-2">PowerSaver Privacy Policy</h1>
        <p className="text-muted">Last updated: November 25, 2026</p>

        <p>
          This policy explains how PowerSaver handles information when you use
          the service to manage properties and understand electricity usage.
        </p>

        <h2 className="h4 mt-4">Information we collect</h2>
        <ul>
          <li>
            <strong>Account information:</strong> name, username, email address,
            and optional phone number. If you register with a password, the
            password is stored as a hash, not as plain text.
          </li>
          <li>
            <strong>Google sign-in information:</strong> your Google account
            identifier, email address, email verification status, and name
            when provided. PowerSaver does not receive your Google password.
          </li>
          <li>
            <strong>Information you enter:</strong> property details, meter
            numbers and readings, appliance details and usage estimates,
            electricity tariffs, bill estimates, and related notes or alerts.
          </li>
          <li>
            <strong>Technical information:</strong> service providers may
            process connection and request metadata to deliver, secure, and
            troubleshoot the website and API.
          </li>
        </ul>

        <h2 className="h4 mt-4">How we use information</h2>
        <p>
          We use this information to create and secure your account, link your
          Google account when you choose Google sign-in, save the information
          you enter, and provide PowerSaver features such as consumption
          summaries, estimates, alerts, and forecasts.
        </p>

        <h2 className="h4 mt-4">Google sign-in</h2>
        <p>
          When you choose Google sign-in, Google provides an identity token so
          PowerSaver can verify your identity. The application stores the
          provider account identifier and email needed to link your account;
          it does not store the identity token as profile data. Google handles
          its own account information under its{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
            Privacy Policy
          </a>
          .
        </p>

        <h2 className="h4 mt-4">Service providers and sharing</h2>
        <p>
          PowerSaver uses Google for sign-in, Vercel to serve the frontend, and
          Render to run the API and store application data. These providers
          process information as needed to provide their services and may
          process technical metadata under their own privacy policies.
        </p>

        <h2 className="h4 mt-4">Storage and security</h2>
        <p>
          PowerSaver stores account and application data with its hosting
          providers. The sign-in token used by the website is stored in your
          browser&apos;s local storage so you can remain signed in. You can log
          out to remove the token from that browser. No method of online
          storage or transmission can be guaranteed completely secure.
        </p>

        <h2 className="h4 mt-4">Retention and your choices</h2>
        <p>
          We retain account information and the data associated with it while
          needed to provide the service. You can update the profile
          information available in your account. To ask a question or request
          access, correction, or deletion of your information, contact the
          support email shown on the PowerSaver Google sign-in consent screen.
          We may need to verify your account before responding.
        </p>
        <p>
          You can also revoke PowerSaver&apos;s access from your Google Account.
          Revoking access does not by itself delete information already saved
          in PowerSaver; contact the support address for a deletion request.
        </p>

        <h2 className="h4 mt-4">Changes and contact</h2>
        <p>
          We may update this policy as the service changes. The latest version
          will be published on this page. For privacy questions or requests,
          use the support email shown on the PowerSaver Google sign-in consent
          screen.
        </p>
      </div>
    </article>
  )
}

export default PrivacyPolicy
