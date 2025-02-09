<?php

Route::inertia('event', 'Some/Page');

Inertia::render('Help');

inertia('Help');


Route::get('/', fn () => inertia('Some/Page'))->name('dashboard');