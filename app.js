const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    console.log("Database Connected successfully ");
    app.listen(3000, () => {
      console.log("Server Run at http://localhost:3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializeDbAndServer();

// this function for first scenario
const hasStatus = (requestQueries) => {
  return requestQueries.status !== undefined;
};

// this function is for second scenario
const hasPriority = (requestQueries) => {
  return requestQueries.priority !== undefined;
};

// this function is for third scenario
const hasPriorityAndStatus = (requestQueries) => {
  return (
    requestQueries.status !== undefined && requestQueries.priority !== undefined
  );
};

// API 1 : Get Details From todo
// Scenario 1
// Sample API /todos/?status=TO%20DO

app.get("/todos/", async (request, response) => {
  let data = null;
  let todoQueries = undefined;
  let { status, priority, search_q = "" } = request.query;
  console.log(status);
  switch (true) {
    case hasStatus(request.query):
      todoQueries = `SELECT
            *
        FROM
            todo 
        WHERE
            todo like '%${search_q}%'
            AND status = '${status}'
            ;`;
      break;

    case hasPriority(request.query):
      todoQueries = `SELECT
            *
        FROM
            todo 
        WHERE
            todo like '%${search_q}%'
            AND priority = '${priority}'
            ;`;
      break;
    case hasPriorityAndStatus(request.query):
      todoQueries = `SELECT
            *
        FROM
            todo 
        WHERE
            todo like '%${search_q}%'
            AND priority = '${priority}'
            AND status = '${status}'
            ;`;

    default:
      todoQueries = `SELECT
            *
        FROM
            todo 
        WHERE
            todo like '%${search_q}%'
            `;
      break;
  }

  data = await db.all(todoQueries);
  response.send(data);
});

// API 2 : Get Details by todoId

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoIdQueries = `
  SELECT * FROM todo
  WHERE 
  id = '${todoId}'
  
  `;
  const updateTodoIdQueries = await db.get(todoIdQueries);
  response.send(updateTodoIdQueries);
});

// API 3 : Add New Object to Todo

app.post("/todos/", async (request, response) => {
  const todosDetails = request.body;
  const { id, todo, priority, status } = todosDetails;
  const todosQueries = `
  INSERT INTO todo (id,todo,priority,status)
  VALUES (
     ?,?,?,?
  )
  `;
  const updateQueries = await db.run(todosQueries, [
    id,
    todo,
    priority,
    status,
  ]);
  response.send("Todo Successfully Added");
});

// API 4 : Update status by todoId
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateQueries = null;

  switch (true) {
    case requestBody.status !== undefined:
      updateQueries = "Status";
      break;
    case requestBody.priority !== undefined:
      updateQueries = "Priority";
      break;
    default:
      updateQueries = "Todo";
      break;
  }

  const getPreviousObjQueries = `
    SELECT * FROM todo 
    WHERE id = ?
  `;
  const previousTodo = await db.get(getPreviousObjQueries, [todoId]);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  console.log(status);

  const updateTodoId = `
    UPDATE todo 
    SET 
      todo = ?,
      priority = ?,
      status = ? 
    WHERE 
      id = ? 
  `;

  await db.run(updateTodoId, [todo, priority, status, todoId]);
  response.send(`${updateQueries} Updated`);
});

// API 5 : Delete row by todoId

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQueries = `
        DELETE FROM todo  
        WHERE id = '${todoId}'
    `;
  const updateQueries = await db.run(deleteQueries);
  response.send("Todo Deleted");
});

module.exports = app;
