const App = ({ children }) => {
    const [clicked, setClicked] = Fla.useState(false);
    const [count, setCount] = Fla.useState(0);

    Fla.useEffect(() => {
        console.log("count", count);
    }, []);

    return (
        <Comp className='test' style={{ display: "flex", flexDirection: "column" }}>
            {count === 2 && <p>count is 2</p>}
            {clicked ? "clicked" : <span>not clicked</span>}
            <div style={{ display: "flex", flexDirection: "column" }}>
                <span>here span inside div</span>
                {count === 10 && <p style={{ color: "red" }}>count is 10</p>}
                <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Recusandae, itaque.</p>
            </div>
            {count === 3 && <p>count is 3</p>}
            <span>span</span>
            <button
                onClick={() => {
                    setClicked(true);
                    setCount(count + 1);
                }}
            >
                {count ? count : "click me"}
            </button>
            {!!count && count <= 10 && <button onClick={() => console.log("test")}>some another button</button>}
        </Comp>
    );
};

const Comp = ({ children, ...props }) => <section {...props}>{children}</section>;

Fla.render(<App>test</App>, document.getElementById("app"));
