// ==UserScript==
// @name         Puzz.link Assistance
// @version      1.0
// @description  Do trivial deduction.
// @author       Leaving Leaves
// @match        https://puzz.link/p?*/*/*/*
// @match        https://pzplus.tck.mn/p?*/*/*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const maxLoop = 20;
    let flg = true;

    let btn = '<button type="button" class="btn" id="assist" style="display: inline;">Assist</button>';
    document.querySelector('#btntrial').insertAdjacentHTML('afterend', btn);
    document.querySelector("#assist").addEventListener("click", assist, false);
    window.addEventListener("keypress", (event) => {
        if (event.key !== 'q') { return; }
        assist();
    });

    function assist() {
        flg = 1;
        if (/slither/.test(document.URL)) { SlitherlinkAssist(); }
        if (/yaji[lr]in/.test(document.URL)) { YajilinAssist(); }
        if (/simpleloop/.test(document.URL)) { SimpleloopAssist(); }
        console.log('Assisted.');
    }
    let fourside = function (a, b) {
        a(b.top);
        a(b.bottom);
        a(b.left);
        a(b.right);
    };
    let fourside2 = function (a, b, c) {
        a(b.top, c.top);
        a(b.bottom, c.bottom);
        a(b.left, c.left);
        a(b.right, c.right);
    };
    let add_cross = function (d) {
        if (d === undefined || d.isnull || d.line === 1 || d.qsub === 2) { return; }
        flg = 1;
        d.setQsub(2);
        d.draw();
    };
    let add_line = function (d) {
        if (d === undefined || d.isnull || d.qsub === 2 || d.line === 1) { return; }
        flg = 1;
        d.setLine(1);
        d.draw();
    };
    let add_block = function (c) {
        if (c === undefined || c.isnull || c.qnum !== -1 || c.lcnt !== 0 || c.qsub === 1 || c.qans === 1) { return; }
        flg = 1;
        c.setQans(1);
        c.draw();
    };
    let add_dot = function (c) {
        if (c === undefined || c.isnull || c.qnum !== -1 || c.qans !== 0 || c.qsub === 1) { return; }
        flg = 1;
        c.setQsub(1);
        c.draw();
    };
    let add_bg_color = function (c, color) {
        if (c === undefined || c.isnull || c.qsub !== 0 || c.qsub === color) { return; }
        flg = 1;
        c.setQsub(color);
        c.draw();
    }
    let add_bg_inner_color = function (c) {
        add_bg_color(c, 1);
    }
    let add_bg_outer_color = function (c) {
        add_bg_color(c, 2);
    }

    let SingleLoopInCell = function (inPath) {
        let board = ui.puzzle.board;
        let cell = board.cell;
        let border = board.border;
        for (let i = 0; i < cell.length; i++) {
            let emptynum = 0;
            let linenum = 0;
            let adjcell = cell[i].adjacent;
            let adjline = cell[i].adjborder;
            let fn = function (c, d) {
                if (!c.isnull && d.qsub !== 2) { emptynum++; }
                linenum += d.line == 1;
            };
            fourside2(fn, adjcell, adjline);
            //no branch
            if (linenum === 2) {
                fourside(add_cross, adjline);
            }
            //no deadend
            if (emptynum === 1) {
                fourside(add_cross, adjline);
            }
            //2 degree path
            if (emptynum === 2 && (linenum === 1 || cell[i].qsub === 1 || inPath)) {
                fourside(add_line, adjline);
            }
        }
        //avoid forming multiple loop
        for (let i = 0; i < border.length; i++) {
            if (border[i].qsub !== 0) { continue; }
            if (border[i].line !== 0) { continue; }
            let cr1 = border[i].sidecell[0];
            let cr2 = border[i].sidecell[1];
            if (cr1.path !== null && cr1.path === cr2.path && board.linegraph.components.length > 1) {
                add_cross(border[i]);
            }
        }
    };

    function SimpleloopAssist() {
        let board = ui.puzzle.board;
        let cell = board.cell;
        for (let loop = 0; loop < maxLoop; loop++) {
            if (!flg) { break; }
            flg = false;
            for (let i = 0; i < cell.length; i++) {
                let adjline = cell[i].adjborder;
                if (cell[i].ques === 7) {
                    fourside(add_cross, adjline);
                }
                SingleLoopInCell(1);
            }
        }
    }

    function YajilinAssist() {
        let board = ui.puzzle.board;
        let cell = board.cell;
        let border = board.border;
        let isPathable = function (c) { return !c.isnull && c.qnum === -1 && c.qans === 0; };
        let isEmpty = function (c) { return !c.isnull && c.qnum === -1 && c.qans === 0 && c.qsub === 0; };
        for (let loop = 0; loop < maxLoop; loop++) {
            if (!flg) { break; }
            flg = false;
            for (let i = 0; i < cell.length; i++) {
                let emptynum = 0;
                let linenum = 0;
                let adjcell = cell[i].adjacent;
                let adjline = cell[i].adjborder;
                //check clue
                if (cell[i].qnum !== -1 && cell[i].qdir !== 0) {
                    let qnum = cell[i].qnum;
                    let qdir = cell[i].qdir;
                    let dirs = [[], [-1, 0], [1, 0], [0, -1], [0, 1]];//Top Bottom Left Right
                    let rows = board.rows, cols = board.cols;
                    let x = Math.floor(i / cols);
                    let y = i % cols;
                    let emptynum = 0;
                    let blocknum = 0;
                    let lastcell = i;
                    while (x >= 0 && y >= 0 && x < rows && y < cols) {
                        emptynum += isEmpty(cell[x * cols + y]);
                        blocknum += cell[x * cols + y].qans === 1;
                        if (isEmpty(cell[lastcell]) && isEmpty(cell[x * cols + y])) {
                            lastcell = i;
                            emptynum--;
                        } else {
                            lastcell = x * cols + y;
                        }
                        x += dirs[qdir][0];
                        y += dirs[qdir][1];
                    }
                    //finish clue
                    if (emptynum + blocknum === qnum) {
                        x = Math.floor(i / cols);
                        y = i % cols;
                        lastcell = i;
                        while (x >= 0 && y >= 0 && x < rows && y < cols) {
                            if (!isEmpty(cell[x * cols + y]) && isEmpty(cell[lastcell])) {
                                add_block(cell[lastcell]);
                            }
                            if (isEmpty(cell[x * cols + y]) && isEmpty(cell[lastcell])) {
                                lastcell = i;
                            } else {
                                lastcell = x * cols + y;
                            }
                            x += dirs[qdir][0];
                            y += dirs[qdir][1];
                        }
                        if (isEmpty(cell[lastcell])) {
                            add_block(cell[lastcell]);
                        }
                    }
                    //finished clue
                    if (blocknum === qnum) {
                        x = Math.floor(i / cols);
                        y = i % cols;
                        while (x >= 0 && y >= 0 && x < rows && y < cols) {
                            if (isEmpty(cell[x * cols + y])) {
                                add_dot(cell[x * cols + y]);
                            }
                            x += dirs[qdir][0];
                            y += dirs[qdir][1];
                        }
                    }
                    //add cross
                    fourside(add_cross, adjline);
                }
                if (cell[i].qnum !== -1) {
                    continue;
                }
                //add dot around block
                if (cell[i].qans === 1) {
                    fourside(add_cross, adjline);
                    fourside(add_dot, adjcell);
                    continue;
                }
                let fn = function (c, d) {
                    if (isPathable(c) && d.qsub !== 2) { emptynum++; }
                    linenum += d.line == 1;
                };
                fourside2(fn, adjcell, adjline);
                //no branch
                if (linenum === 2) {
                    fourside(add_cross, adjline);
                }
                //no deadend
                if (emptynum <= 1) {
                    add_block(cell[i]);
                    fourside(add_cross, adjline);
                    fourside(add_dot, adjcell);
                }
                //2 degree cell no deadend
                if (emptynum === 2) {
                    let fn = function (c, d) {
                        if (!isPathable(c) || d.qsub === 2) { return; }
                        add_dot(c);
                    };
                    fourside2(fn, adjcell, adjline);
                }
            }
            SingleLoopInCell(0);
        }
    }

    function SlitherlinkAssist() {
        let board = ui.puzzle.board;
        let cell = board.cell;
        let cross = board.cross;
        let border = board.border;
        for (let loop = 0; loop < maxLoop; loop++) {
            board.outlineShaded();
            if (!flg) { break; }
            flg = false;
            // deduce cell
            for (let i = 0; i < cell.length; i++) {
                let adjline = cell[i].adjborder;
                let emptynum = 0;
                let linenum = 0;
                //add cross for 0
                if (cell[i].qnum === 0) {
                    fourside(add_cross, adjline);
                }
                let fn = function (d) {
                    if (d.qsub === 0) { emptynum++; }
                    linenum += (d.line == 1);
                };
                fourside(fn, adjline);
                //finish number
                if (emptynum === cell[i].qnum) {
                    fourside(add_line, adjline);
                }
                //add cross for finished number
                if (linenum === cell[i].qnum) {
                    fourside(add_cross, adjline);
                }
                // vertical 3s
                if (cell[i].qnum === 3 && cell[i].adjacent.bottom !== undefined && cell[i].adjacent.bottom.qnum === 3) {
                    add_line(cell[i].adjborder.top);
                    add_line(cell[i].adjborder.bottom);
                    add_line(cell[i].adjacent.bottom.adjborder.bottom);
                    if (cell[i].adjacent.left !== undefined) { add_cross(cell[i].adjacent.left.adjborder.bottom); }
                    if (cell[i].adjacent.right !== undefined) { add_cross(cell[i].adjacent.right.adjborder.bottom); }
                }
                // horizontal 3s
                if (cell[i].qnum === 3 && cell[i].adjacent.right !== undefined && cell[i].adjacent.right.qnum === 3) {
                    add_line(cell[i].adjborder.left);
                    add_line(cell[i].adjborder.right);
                    add_line(cell[i].adjacent.right.adjborder.right);
                    if (cell[i].adjacent.top !== undefined) { add_cross(cell[i].adjacent.top.adjborder.right); }
                    if (cell[i].adjacent.bottom !== undefined) { add_cross(cell[i].adjacent.bottom.adjborder.right); }
                }
                //sub diagonal 3s
                if (cell[i].qnum === 3 && cell[i].adjacent.bottom !== undefined && cell[i].adjacent.bottom.adjacent.left !== undefined && cell[i].adjacent.bottom.adjacent.left.qnum === 3) {
                    let cell2 = cell[i].adjacent.bottom.adjacent.left;
                    add_line(cell[i].adjborder.top);
                    add_line(cell[i].adjborder.right);
                    add_line(cell2.adjborder.bottom);
                    add_line(cell2.adjborder.left);
                }
                //main diagonal 3s
                if (cell[i].qnum === 3 && cell[i].adjacent.bottom !== undefined && cell[i].adjacent.bottom.adjacent.right !== undefined && cell[i].adjacent.bottom.adjacent.right.qnum === 3) {
                    let cell2 = cell[i].adjacent.bottom.adjacent.right;
                    add_line(cell[i].adjborder.top);
                    add_line(cell[i].adjborder.left);
                    add_line(cell2.adjborder.bottom);
                    add_line(cell2.adjborder.right);
                }
            }
            //deduce cross
            for (let i = 0; i < cross.length; i++) {
                let adjline = cross[i].adjborder;
                let emptynum = 0;
                let linenum = 0;
                let fn = function (d) {
                    if (d !== undefined && !d.isnull && d.qsub === 0) { emptynum++; }
                    linenum += (d.line == 1);
                };
                fourside(fn, adjline);
                //no deadend or branch
                if (emptynum === 1 || linenum === 2) {
                    fourside(add_cross, adjline);
                }
                //extend deadend
                if (emptynum === 2 && linenum === 1) {
                    fourside(add_line, adjline);
                }
                //empty turn with 1 or 3
                if (emptynum === 2 && linenum === 0) {
                    let fn = function (c) { return c !== undefined && !c.isnull && c.qsub === 0; }
                    if (fn(adjline.top) && fn(adjline.left) && adjline.top.sidecell[0].qnum === 3) { fourside(add_line, adjline); }
                    if (fn(adjline.top) && fn(adjline.right) && adjline.top.sidecell[1].qnum === 3) { fourside(add_line, adjline); }
                    if (fn(adjline.bottom) && fn(adjline.left) && adjline.bottom.sidecell[0].qnum === 3) { fourside(add_line, adjline); }
                    if (fn(adjline.bottom) && fn(adjline.right) && adjline.bottom.sidecell[1].qnum === 3) { fourside(add_line, adjline); }

                    if (fn(adjline.top) && fn(adjline.left) && adjline.top.sidecell[0].qnum === 1) { fourside(add_cross, adjline); }
                    if (fn(adjline.top) && fn(adjline.right) && adjline.top.sidecell[1].qnum === 1) { fourside(add_cross, adjline); }
                    if (fn(adjline.bottom) && fn(adjline.left) && adjline.bottom.sidecell[0].qnum === 1) { fourside(add_cross, adjline); }
                    if (fn(adjline.bottom) && fn(adjline.right) && adjline.bottom.sidecell[1].qnum === 1) { fourside(add_cross, adjline); }
                }
            }
            //avoid forming multiple loop
            for (let i = 0; i < border.length; i++) {
                if (border[i].qsub !== 0) { continue; }
                if (border[i].line !== 0) { continue; }
                let cr1 = border[i].sidecross[0];
                let cr2 = border[i].sidecross[1];
                if (cr1.path !== null && cr1.path === cr2.path && board.linegraph.components.length > 1) {
                    add_cross(border[i]);
                }
            }
            //deduce color
            for (let i = 0; i < cell.length; i++) {
                let adjline = cell[i].adjborder;
                let adjcell = cell[i].adjacent;
                //deduce neighbor color
                {
                    let fn = function (cn, dn) {
                        if (dn.line === 1 && cn.isnull) {
                            add_bg_inner_color(cell[i]);
                        }
                        if (dn.qsub === 2 && cn.isnull) {
                            add_bg_outer_color(cell[i]);
                        }
                        if (dn.line === 1 && !cn.isnull && cn.qsub !== 0) {
                            add_bg_color(cell[i], 3 - cn.qsub);
                        }
                        if (dn.qsub === 2 && !cn.isnull && cn.qsub !== 0) {
                            add_bg_color(cell[i], cn.qsub);
                        }
                    };
                    fourside2(fn, adjcell, adjline);
                }
                //number and color deduce
                {
                    let innernum = 0;
                    let outernum = 0;
                    let fn = function (c) {
                        if (!c.isnull && c.qsub === 1) { innernum++; }
                        if (c.isnull || c.qsub === 2) { outernum++; }
                    };
                    fourside(fn, adjcell);
                    if (innernum === 4) {
                        add_bg_inner_color(cell[i]);
                    }
                    if (outernum === 4) {
                        add_bg_outer_color(cell[i]);
                    }
                    if (cell[i].qnum === -1) {
                        continue;
                    }
                    if (cell[i].qnum < innernum || 4 - cell[i].qnum < outernum) {
                        add_bg_inner_color(cell[i]);
                    }
                    if (cell[i].qnum < outernum || 4 - cell[i].qnum < innernum) {
                        add_bg_outer_color(cell[i]);
                    }
                    if (cell[i].qsub === 1 && cell[i].qnum === outernum) {
                        fourside(add_bg_inner_color, adjcell);
                    }
                    if (cell[i].qsub === 2 && cell[i].qnum === innernum) {
                        fourside(add_bg_outer_color, adjcell);
                    }
                    if (cell[i].qsub === 2 && cell[i].qnum === 4 - outernum) {
                        fourside(add_bg_inner_color, adjcell);
                    }
                    if (cell[i].qsub === 1 && cell[i].qnum === 4 - innernum) {
                        fourside(add_bg_outer_color, adjcell);
                    }
                    if (cell[i].qnum === 2 && outernum === 2) {
                        fourside(add_bg_inner_color, adjcell);
                    }
                    if (cell[i].qnum === 2 && innernum === 2) {
                        fourside(add_bg_outer_color, adjcell);
                    }
                }
                //checker pattern
                {
                    let fn = function (c, c1, c2, c12) {
                        if (c1.isnull || c2.isnull || c12.isnull) { return; }
                        if (c1.qsub === 0 || c2.qsub === 0 || c12.qsub === 0) { return; }
                        if (c1.qsub === c2.qsub && c1.qsub !== c12.qsub) {
                            add_bg_color(c, c1.qsub);
                        }
                    };
                    fn(cell[i], adjcell.top, adjcell.left, adjcell.top.adjacent.left);
                    fn(cell[i], adjcell.top, adjcell.right, adjcell.top.adjacent.right);
                    fn(cell[i], adjcell.bottom, adjcell.left, adjcell.bottom.adjacent.left);
                    fn(cell[i], adjcell.bottom, adjcell.right, adjcell.bottom.adjacent.right);
                }
            }
        }
    }

})();