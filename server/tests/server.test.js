var expect = require("expect");
var request = require("supertest");
const {
    ObjectID
} = require("mongodb");

var {
    app
} = require("./../server");
var {
    Todo
} = require("./../models/Todo");


const todos = [{
    _id: ObjectID(),
    text: "first text todo"
}, {
    _id: ObjectID(),
    text: "second text todo",
    completed: true,
    completedAt: 333
}];



beforeEach((done) => {
    Todo.remove({}).then(() => {
        Todo.insertMany(todos);
    }).then(() => done());
});

describe("POST /todos", () => {
    it("should create a new todo", (done) => {
        var text = "test todo text";
        request(app)
            .post("/todos")
            .send({
                text
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(text);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                Todo.find({
                    text
                }).then((todos) => {
                    expect(todos.length).toBe(1);
                    expect(todos[0].text).toBe(text);
                    done();
                }).catch((e) => {
                    return done(e)
                });
            });
    });

    it("should not create a todo with invalid body data", (done) => {
        request(app)
            .post("/todos")
            .send({})
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.find().then((todos) => {
                    expect(todos.length).toBe(2);
                    done();
                }).catch((e) => {
                    return done(e)
                })
            })

    });
});

describe("GET /todos", () => {
    it("should get all todos", (done) => {
        request(app)
            .get("/todos")
            .expect(200)
            .expect((res) => {
                expect(res.body.todos.length).toBe(2);
            }).end(done);
    })
})

describe("GET /todos:id", () => {
    it("should return todo doc", (done) => {
        request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(todos[0].text);
            })
            .end(done);
    })
    it("should return 404  if todo not found", (done) => {
        request(app)
            .get(`/todos/${new ObjectID().toHexString()}`)
            .expect(404)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                done();
            })

    })
    it("should return 404 for non object ids ", (done) => {
        request(app)
            .get("/todos/12345678")
            .expect(404)
            .end(done);
    })

})

describe("PATCH .todos/:id", ()=>{
    it("should update the todo", (done)=>{
        var hexId = todos[0]._id.toHexString();
        var text = "this is the new text"
        request(app)
        .patch(`/todos/${hexId}`)
        .send({
            completed: true,
            text
        })
        .expect(200)
        .expect((res)=>{
            expect(res.body.todo.text).toBe(text);
            expect(typeof res.body.todo.completedAt).toBe('number');
            expect(res.body.todo.completed).toBe(true);
        })
        .end(done);
    });
    it("should clear completedAt when todo is not completed", (done)=>{
        var hexId = todos[1]._id.toHexString();
        request(app)
        .patch(`/todos/${hexId}`)
        .send({
            text: "this is the updated text",
            completed: false
        })
        .expect(200)
        .expect((res)=>{
            expect(res.body.todo.completed).toBe(false);
            expect(res.body.todo.completedAt).toBe(null) ;

        })
        .end(done);
    })
})