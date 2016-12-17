
export class AsyncResult<T> {
    taskThisArg;
    resultThisArg;
    task: (asyncResult: AsyncResult<T>) => void;
    resultCallback: (result: T) => void;

    constructor(task: (asyncResult: AsyncResult<T>) => void, taskThisArg) {
        this.task = task;
        this.taskThisArg = taskThisArg;
    }

    public then(callback: (result: T) => void, thisArg) {
        try {
            this.resultCallback = callback;
            this.resultThisArg = thisArg;
            this.task.call(this.taskThisArg, this);
        } catch (e) {
            console.log(e);
        }
    };

    public result(result: T) {
        try {
            this.resultCallback.call(this.resultThisArg, result);
        } catch (e) {
            console.log(e);
        }
    };

    public chain(asyncResult: AsyncResult<any>) {
        this.then(() => {
            asyncResult.done();
        }, this);
    }

    public done() {
        try {
            this.resultCallback.apply(this.resultThisArg);
        } catch (e) {
            console.log(e);
        }
    }
}