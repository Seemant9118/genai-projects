export const executorTools = {
    identifyFields: (context) => {
        return "Fields identified: username, password, remember me checkbox";
    },

    generatePositiveTests: () => {
        return [
            "Login with valid username and password",
            "Login with valid credentials and remember me checked",
        ];
    },

    generateNegativeTests: () => {
        return [
            "Login with invalid password",
            "Login with empty username",
        ];
    },
};