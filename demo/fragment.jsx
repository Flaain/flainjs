const App = ({ children }) => {
    const [count, setCount] = Fla.useState(0);

    return (
        <>
            {children}
            <>
                {count === 2 && <p>count is 2</p>}
                <>
                    <span>here span inside div</span>
                    {count === 10 && <p style={{ color: "red" }}>count is 10</p>}
                    <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Recusandae, itaque.</p>
                </>
                {count === 3 && <p>count is 3</p>}
                <span>span</span>
                <button onClick={() => setCount(count + 1)}>{count || "click me"}</button>
                {!!count && count <= 10 && <button onClick={() => console.log("test")}>some another button</button>}
            </>
        </>
    );
};

const Comp = ({ children, ...props }) => <section {...props}>{children}</section>;

Fla.render(<App>test</App>, document.getElementById("app"));