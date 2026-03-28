const app = require('./src/server');

const port = process.env.PORT || 5003;

app.listen(port, "0.0.0.0", () => {
    console.log(`Server is listening on port: ${port}`);
});