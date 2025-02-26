import { Fla } from '../index';

const getComments = async ({ signal }) => {
    const res = await fetch("https://jsonplaceholder.typicode.com/comments", { signal });
    
    return res.json();
}

const App = () => {
    const [count, setCount] = Fla.useState(0);
    const { data, isLoading, isError } = Fla.useQuery(getComments);
    
    console.log(data, isLoading);
    
    return isLoading || isError ? (
        <p>{isLoading ? 'Loading...' : 'Something went wrong while fetching comments'}</p>
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