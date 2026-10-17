import { Link, useOutletContext } from 'react-router-dom'

// Shows the page only if the signed-in role may use it. The server checks again on every request.
export default function Perm({ perm, children }) {
  const { me } = useOutletContext()
  if (me.permissions.includes(perm)) return children
  return (
    <div className="card">
      <h1 className="mb-2 text-2xl font-extrabold">No access</h1>
      <p className="mb-4">Your role does not include this page. Ask a super admin if you need it.</p>
      <Link to="/admin" className="abtn-primary">Back to overview</Link>
    </div>
  )
}
