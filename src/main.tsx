import { _INTERNAL_STATE, render } from "./shared/lib/flact";

const App = () => {
    return (
        <div>
            test
        </div>
    )
}

render(<div>
    <App />
    nested component
</div>, document.getElementById('app')!)