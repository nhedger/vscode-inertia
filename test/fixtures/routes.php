<?php

Route::inertia('event', 'Some/Page');

Inertia::render('Help');

inertia('Help');

// New modular examples with prefixes
Route::get('/shipping/orders', fn () => inertia('Shipping:Orders/Index'))->name('shipping.orders');
Route::get('/accounting/reports', fn () => inertia('Accounting:Reports/Balance'))->name('accounting.reports');
Route::get('/inventory/items', fn () => inertia('Inventory:Items/List'))->name('inventory.items');

Route::get('/', fn () => inertia('Some/Page'))->name('dashboard');
