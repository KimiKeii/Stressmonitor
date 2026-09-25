<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoUsersSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'counselor@ue.edu.ph'],
            [
                'name' => 'Ma\'am Faith Eluna',
                'password' => Hash::make('password'),
                'role' => 'counselor',
            ]
        );

        User::firstOrCreate(
            ['email' => 'student1@ue.edu.ph'],
            [
                'name' => '',
                'password' => Hash::make('password'),
                'role' => 'student',
                'patient_code' => 'STU-' . strtoupper(Str::random(6)),
                'course' => 'BS Psychology',
                'college' => 'College of Education',
                'age' => 19,
            ]
        );
    }
}
