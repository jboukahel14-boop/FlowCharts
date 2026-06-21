<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreWorkflowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'nodes' => ['required', 'array', 'min:1'],
            'nodes.*.id' => ['required', 'string', 'max:64'],
            'nodes.*.type' => ['required', 'string', 'in:trigger,action,condition'],
            'nodes.*.position' => ['required', 'array'],
            'nodes.*.position.x' => ['required', 'numeric'],
            'nodes.*.position.y' => ['required', 'numeric'],
            'nodes.*.data' => ['required', 'array'],
            'nodes.*.data.label' => ['required', 'string', 'max:255'],
            'edges' => ['present', 'array'],
            'edges.*.source' => ['required', 'string', 'max:64'],
            'edges.*.target' => ['required', 'string', 'max:64'],
            'edges.*.sourceHandle' => ['nullable', 'string'],
            'edges.*.targetHandle' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:draft,active,archived,invalid'],
        ];
    }

    public function messages(): array
    {
        return [
            'nodes.required' => 'A workflow must contain at least one node.',
            'nodes.min' => 'A workflow must contain at least one node.',
            'nodes.*.type.in' => 'Node type must be one of: trigger, action, condition.',
            'name.required' => 'Workflow name is required.',
            'name.max' => 'Workflow name must not exceed 255 characters.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()->toArray(),
            ], 422)
        );
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'nodes' => $this->input('nodes', []),
            'edges' => $this->input('edges', []),
        ]);
    }
}
