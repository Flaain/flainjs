import { Fla } from "../index";

const App = () => {
    const [data, setData] = Fla.useState(null);
    const [loading, setLoading] = Fla.useState(true);
    const [count, setCount] = Fla.useState(0);

    Fla.useEffect(() => {
        (async () => {
            try {
                const res = await fetch("https://jsonplaceholder.typicode.com/comments");
                const data = await res.json();

                setData(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return loading ? (
        <p>Loading...</p>
    ) : (
        <ul style={{ display: "flex", flexDirection: "column", listStyleType: "none" }}>
            <li>
                <span>{count}</span>
                <button onClick={() => setCount((prevState) => prevState + 1)}>click me</button>
            </li>
            {data.map(({ id, name, email, body }) => (
                <li key={id} style={{ display: "flex", flexDirection: "column" }}>
                    <h3>{name}</h3>
                    <p>{email}</p>
                    <p>{body}</p>
                </li>
            ))}
        </ul>
    );
};

Fla.render(<App />, document.getElementById("app"));