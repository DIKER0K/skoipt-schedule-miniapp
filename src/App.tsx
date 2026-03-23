import { useEffect, useState } from "react";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    fetch("http://localhost:8000/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setUser);
  }, []);

  if (!user) return <div>Loading...</div>;

  console.log(user);

  return (
    <div>
      <h1>Привет, {user.first_name}</h1>
      <p>Группа: {user.group}</p>
    </div>
  );
}

export default App;
