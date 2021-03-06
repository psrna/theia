/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import URI from "@theia/core/lib/common/uri";
import { Path } from "@theia/core";

export interface WorkingDirectoryStatus {

    /**
     * `true` if the repository exists, otherwise `false`.
     */
    readonly exists: boolean;

    /**
     * An array of changed files.
     */
    readonly changes: GitFileChange[];

    /**
     * The optional name of the branch. Can be absent.
     */
    readonly branch?: string;

    /**
     * The name of the upstream branch. Optional.
     */
    readonly upstreamBranch?: string;

    /**
     * Wraps the `ahead` and `behind` numbers.
     */
    readonly aheadBehind?: { ahead: number, behind: number };

    /**
     * The hash string of the current HEAD.
     */
    readonly currentHead?: string;

}

export namespace WorkingDirectoryStatus {

    /**
     * `true` if the directory statuses are deep equal, otherwise `false`.
     */
    export function equals(left: WorkingDirectoryStatus | undefined, right: WorkingDirectoryStatus | undefined): boolean {
        if (left && right) {
            return left.exists === right.exists
                && left.branch === right.branch
                && left.upstreamBranch === right.upstreamBranch
                && left.currentHead === right.currentHead
                && (left.aheadBehind ? left.aheadBehind.ahead : -1) === (right.aheadBehind ? right.aheadBehind.ahead : -1)
                && (left.aheadBehind ? left.aheadBehind.behind : -1) === (right.aheadBehind ? right.aheadBehind.behind : -1)
                && left.changes.length === right.changes.length
                && JSON.stringify(left) === JSON.stringify(right);
        } else {
            return left === right;
        }
    }

}

/**
 * Enumeration of states that a file resource can have in the working directory.
 */
export enum GitFileStatus {
    'New',
    'Copied',
    'Modified',
    'Renamed',
    'Deleted',
    'Conflicted',
}

export namespace GitFileStatus {

    /**
     * Compares the statuses based on the natural order of the enumeration.
     */
    export const statusCompare = (left: GitFileStatus, right: GitFileStatus): number => left - right;

    /**
     * Returns with human readable representation of the Git file status argument. If the `staged` argument is `undefined`,
     * it will be treated as `false`.
     */
    export const toString = (status: GitFileStatus, staged?: boolean): string => {
        switch (status) {
            case GitFileStatus.New: return !!staged ? 'Added' : 'Unstaged';
            case GitFileStatus.Renamed: return 'Renamed';
            case GitFileStatus.Copied: return 'Copied';
            case GitFileStatus.Modified: return 'Modified';
            case GitFileStatus.Deleted: return 'Deleted';
            case GitFileStatus.Conflicted: return 'Conflicted';
            default: throw new Error(`Unexpected Git file stats: ${status}.`);
        }
    };

    /**
     * Returns with the human readable abbreviation of the Git file status argument. `staged` argument defaults to `false`.
     */
    export const toAbbreviation = (status: GitFileStatus, staged?: boolean): string => GitFileStatus.toString(status, staged).charAt(0);

}

/**
 * Representation of an individual file change in the working directory.
 */
export interface GitFileChange {

    /**
     * The current URI of the changed file resource.
     */
    readonly uri: string;

    /**
     * The file status.
     */
    readonly status: GitFileStatus;

    /**
     * The previous URI of the changed URI. Can be absent if the file is new, or just changed and so on.
     */
    readonly oldUri?: string;

    /**
     * `true` if the file is staged, otherwise `false`. If absent, it means, not staged.
     */
    readonly staged?: boolean;

}

/**
 * An object encapsulating the changes to a committed file.
 */
export interface CommittedFileChange extends GitFileChange {

    /**
     * A commit SHA or some other identifier that ultimately dereferences to a commit.
     * This is the pointer to the `after` version of this change. For instance, the parent of this
     * commit will contain the `before` (or nothing, if the file change represents a new file).
     */
    readonly commitish: string;

}

/**
 * Bare minimum representation of a local Git clone.
 */
export interface Repository {

    /**
     * The FS URI of the local clone.
     */
    readonly localUri: string;

}

export namespace Repository {
    export function equal(repository: Repository | undefined, repository2: Repository | undefined): boolean {
        if (repository && repository2) {
            return repository.localUri === repository2.localUri;
        }
        return repository === repository2;
    }
    export function is(repository: Object | undefined): repository is Repository {
        return !!repository && 'localUri' in repository;
    }
    export function relativePath(repository: Repository | string, uri: URI | string): Path {
        const repositoryUri = new URI(Repository.is(repository) ? repository.localUri : repository);
        return new Path(uri.toString().substr(repositoryUri.toString().length + 1));
    }
}

/**
 * The branch type. Either local or remote.
 * The order matters.
 */
export enum BranchType {

    /**
     * The local branch type.
     */
    Local = 0,

    /**
     * The remote branch type.
     */
    Remote = 1

}

/**
 * Representation of a Git branch.
 */
export interface Branch {

    /**
     * The short name of the branch. For instance; `master`.
     */
    readonly name: string;

    /**
     * The remote-prefixed upstream name. For instance; `origin/master`.
     */
    readonly upstream?: string;

    /**
     * The type of branch. Could be either [local](BranchType.Local) or [remote](BranchType.Remote).
     */
    readonly type: BranchType;

    /**
     * The commit associated with this branch.
     */
    readonly tip: Commit;

    /**
     * The name of the remote of the upstream.
     */
    readonly remote?: string;

    /**
     * The name of the branch's upstream without the remote prefix.
     */
    readonly upstreamWithoutRemote?: string;

    /**
     * The name of the branch without the remote prefix. If the branch is a local
     * branch, this is the same as its `name`.
     */
    readonly nameWithoutRemote: string;

}

/**
 * Representation of a Git tag.
 */
export interface Tag {

    /**
     * The name of the tag.
     */
    readonly name: string;
}

/**
 * A Git commit.
 */
export interface Commit {

    /**
     * The commit SHA.
     */
    readonly sha: string;

    /**
     * The first line of the commit message.
     */
    readonly summary: string;

    /**
     * The commit message without the first line and CR.
     */
    readonly body?: string;

    /**
     * Information about the author of this commit. It includes name, email and date.
     */
    readonly author: CommitIdentity;

    /**
     * The SHAs for the parents of the commit.
     */
    readonly parentSHAs?: string[];

}

/**
 * Representation of a Git commit, plus the changes that were performed in that particular commit.
 */
export interface CommitWithChanges extends Commit {

    /**
     * The date when the commit was authored.
     */
    readonly authorDateRelative: string;

    /**
     * The number of file changes per commit.
     */
    readonly fileChanges: GitFileChange[];
}

/**
 * A tuple of name, email, and a date for the author or commit info in a commit.
 */
export interface CommitIdentity {

    /**
     * The name for the commit.
     */
    readonly name: string;

    /**
     * The email address for the user who did the commit.
     */
    readonly email: string;

    /**
     * The date of the commit.
     */
    readonly timestamp: number;

    /**
     * The time-zone offset.
     */
    readonly tzOffset?: number;

}

/**
 * The result of shelling out to Git.
 */
export interface GitResult {

    /**
     * The standard output from Git.
     */
    readonly stdout: string;

    /**
     * The standard error output from Git.
     */
    readonly stderr: string;

    /**
     * The exit code of the Git process.
     */
    readonly exitCode: number;

}

/**
 * The Git errors which can be parsed from failed Git commands.
 */
export declare enum GitError {
    SSHKeyAuditUnverified = 0,
    SSHAuthenticationFailed = 1,
    SSHPermissionDenied = 2,
    HTTPSAuthenticationFailed = 3,
    RemoteDisconnection = 4,
    HostDown = 5,
    RebaseConflicts = 6,
    MergeConflicts = 7,
    HTTPSRepositoryNotFound = 8,
    SSHRepositoryNotFound = 9,
    PushNotFastForward = 10,
    BranchDeletionFailed = 11,
    DefaultBranchDeletionFailed = 12,
    RevertConflicts = 13,
    EmptyRebasePatch = 14,
    NoMatchingRemoteBranch = 15,
    NothingToCommit = 16,
    NoSubmoduleMapping = 17,
    SubmoduleRepositoryDoesNotExist = 18,
    InvalidSubmoduleSHA = 19,
    LocalPermissionDenied = 20,
    InvalidMerge = 21,
    InvalidRebase = 22,
    NonFastForwardMergeIntoEmptyHead = 23,
    PatchDoesNotApply = 24,
    BranchAlreadyExists = 25,
    BadRevision = 26,
    NotAGitRepository = 27,
    CannotMergeUnrelatedHistories = 28,
    LFSAttributeDoesNotMatch = 29,
    PushWithFileSizeExceedingLimit = 30,
    HexBranchNameRejected = 31,
    ForcePushRejected = 32,
    InvalidRefLength = 33,
    ProtectedBranchRequiresReview = 34,
    ProtectedBranchForcePush = 35,
    PushWithPrivateEmail = 36
}

export interface GitFileBlame {
    readonly uri: string;
    readonly commits: Commit[];
    readonly lines: CommitLine[];
}

export interface CommitLine {
    readonly sha: string;
    readonly line: number;
}
