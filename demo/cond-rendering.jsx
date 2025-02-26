import { Fla } from '../index';

const App = ({ children }) => {
    const [clicked, setClicked] = Fla.useState(false);
    const [count, setCount] = Fla.useState(0);
    
    const someMemoizedValue = Fla.useMemo(() => ({ value: 1 }), []);
    const divRef = Fla.useRef(null);
    const sectionRef = Fla.useRef(null);

    Fla.useEffect(() => {
        console.log("count", count, divRef, sectionRef);

        return () => {
            console.log("cleanup");
        };
    }, [count]);

    return (
        <div ref={divRef} {...(count > 2 && { style: { color: "red" } })}>
            {children}
            {count > 2 && <p>some dscr above comp</p>}
            <Comp ref={sectionRef} className='test' style={{ display: "flex", flexDirection: "column" }}>
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
                    {count || "click me"}
                </button>
                {!!count && count <= 10 && <button onClick={() => console.log("test")}>some another button</button>}
            </Comp>
        </div>
    );
};

const Comp = ({ children, ...props }) => <section ref={props.ref} {...props}>{children}</section>;

Fla.render(<App>test</App>, document.getElementById("app"));