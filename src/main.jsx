import { render } from "./shared/lib/flact";

const App = ({ children }) => {
    return (
        <section className='test' style={{ display: 'flex', flexDirection: 'column' }}>
            <div>one div</div>
            <span>span</span>
            <button onClick={() => console.log('click')}>click me</button>
        </section>
    );
};

const Comp = ({ children }) => <section>{children}</section>;

render(<App>test</App>, document.getElementById("app"));
