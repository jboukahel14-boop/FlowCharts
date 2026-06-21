<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Workflow extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'user_id',
        'name',
        'description',
        'nodes',
        'edges',
        'execution_plan',
        'status',
        'last_validated_at',
        'validation_errors',
        'last_executed_at',
        'execution_count',
    ];

    protected $casts = [
        'nodes' => 'array',
        'edges' => 'array',
        'execution_plan' => 'array',
        'validation_errors' => 'array',
        'last_validated_at' => 'datetime',
        'last_executed_at' => 'datetime',
        'execution_count' => 'integer',
    ];

    protected $attributes = [
        'status' => 'draft',
        'execution_count' => 0,
    ];

    protected static function booted(): void
    {
        static::creating(function (Workflow $workflow) {
            if (empty($workflow->uuid)) {
                $workflow->uuid = (string) Str::uuid();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeOwnedBy($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where('name', 'like', "%{$term}%")
            ->orWhere('description', 'like', "%{$term}%");
    }

    public function markAsExecuted(): void
    {
        $this->increment('execution_count');
        $this->last_executed_at = now();
        $this->save();
    }

    public function setValidationResult(array $result): void
    {
        $this->last_validated_at = now();
        $this->validation_errors = $result['valid'] ? null : $result['errors'];
        $this->save();
    }

    public function getNodeCountAttribute(): int
    {
        return count($this->nodes ?? []);
    }

    public function getEdgeCountAttribute(): int
    {
        return count($this->edges ?? []);
    }

    public function isValid(): bool
    {
        return $this->status !== 'invalid' && empty($this->validation_errors);
    }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'node_count' => $this->node_count,
            'edge_count' => $this->edge_count,
        ]);
    }
}
