"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var adapter_github_actions_1 = __importDefault(require("@probot/adapter-github-actions"));
var slugify_1 = __importDefault(require("slugify"));
var date = new Date();
var app = function (app) {
    app.on('workflow_dispatch', function (context) { return __awaiter(void 0, void 0, void 0, function () {
        var releaseInput, releaseTitle, releaseDate, releaseBranch, differenceOfCommits, releaseNotes;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    app.log("Creating release");
                    releaseInput = (_a = context.payload.inputs) === null || _a === void 0 ? void 0 : _a.release_title;
                    releaseTitle = (0, slugify_1.default)(releaseInput || 'release');
                    releaseDate = "".concat(date.getFullYear(), "-").concat(date.getMonth() + 1, "-").concat(date.getDate());
                    releaseBranch = "release/".concat(releaseDate, "-").concat(releaseTitle);
                    return [4 /*yield*/, context.octokit.rest.git.createRef({
                            owner: context.payload.repository.owner.login,
                            repo: context.payload.repository.name,
                            ref: "refs/heads/".concat(releaseBranch),
                            sha: context.payload.repository.default_branch,
                        })];
                case 1:
                    _b.sent();
                    app.log("Created branch ".concat(releaseBranch));
                    return [4 /*yield*/, context.octokit.rest.repos.compareCommits({
                            owner: context.payload.repository.owner.login,
                            repo: context.payload.repository.name,
                            base: context.payload.repository.default_branch,
                            head: releaseBranch,
                        })];
                case 2:
                    differenceOfCommits = _b.sent();
                    app.log("Found ".concat(differenceOfCommits.data.commits.length, " commits between ").concat(context.payload.repository.default_branch, " and ").concat(releaseBranch));
                    releaseNotes = differenceOfCommits.data.commits
                        .map(function (commit) { return commit.commit.message; })
                        .join('\n\n');
                    return [4 /*yield*/, context.octokit.rest.repos.createRelease({
                            owner: context.payload.repository.owner.login,
                            repo: context.payload.repository.name,
                            tag_name: "".concat(releaseDate, "-").concat(releaseTitle),
                            target_commitish: context.payload.repository.default_branch,
                            name: "".concat(releaseDate, " ").concat(releaseInput),
                            body: releaseNotes,
                            draft: false,
                            prerelease: false,
                        })];
                case 3:
                    _b.sent();
                    app.log("Created release ".concat(releaseTitle));
                    return [2 /*return*/];
            }
        });
    }); });
};
adapter_github_actions_1.default.run(app).catch(function (error) {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map