import { TextField } from "../ui/Field";

// Returns an error message, or "" when the password is acceptable.
export const passwordProblem = (password, confirm) => {
    if (password.length < 8) return "Use at least 8 characters.";
    if (!/\d/.test(password)) return "Include at least one number.";
    if (!/[^A-Za-z0-9]/.test(password)) return "Include at least one symbol, like ! or @.";
    if (password !== confirm) return "The passwords don't match.";
    return "";
};

export const PasswordFields = ({ password, confirm, onChange, error, required = true }) => (
    <div className="grid gap-4 sm:grid-cols-2">
        <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => onChange("password", event.target.value)}
            required={required}
            hint="8+ characters with a number and a symbol"
        />
        <TextField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => onChange("confirmPassword", event.target.value)}
            required={required}
            error={error}
        />
    </div>
);
