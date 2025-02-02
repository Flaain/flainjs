import { _INTERNAL_STATE, render } from "./shared/lib/flact";

const App = () => {
    return <div><span>test</span></div>;
};

const Comp = ({ children }) => <section>{children}</section>;

render(
    <div onClick={() => console.log('test')}>
        nested component
    </div>,
    document.getElementById("app")!
);