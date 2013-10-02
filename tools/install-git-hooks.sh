#!/bin/bash

dir=`pwd`
while [ ! -d "$dir/.git" ]; do
    dir=`dirname $dir`
    if [ "$dir" == "/" ]; then
        echo "Cannot find .git directory."
        exit 1
    fi
done

if [ -e "$dir/.git/hooks/pre-commit" ]; then
    echo "A pre-commit is already installed. Please remove the following file"
    echo "it if you wish to (re)install this commit hook:"
    echo "  $dir/.git/hooks/pre-commit"
    exit 1
else
    ln -s "$dir/tools/git-pre-commit" "$dir/.git/hooks/pre-commit"
    echo "Git pre-commit hook installed."
fi
