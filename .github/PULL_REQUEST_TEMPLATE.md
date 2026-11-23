## Summary

<!-- What problem does this change solve, and why is it needed? -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Refactor (no behaviour change)
- [ ] Test or CI change
- [ ] Security fix

## Affected components

- [ ] `services/agent`
- [ ] `services/knowledge-base`
- [ ] `apps/admin-web`
- [ ] `apps/api`
- [ ] `apps/pos-web` / `apps/tablet-web` / `apps/mobile-web` / `apps/realtime-gateway`
- [ ] `benchmarks`
- [ ] `deploy`
- [ ] Documentation

## Verification

Paste the commands you ran and their result:

```text
# example
cd services/agent && python -m pytest -q
204 passed
```

## Checklist

- [ ] Tests covering the change pass locally.
- [ ] No assertion was weakened or removed to make a test pass.
- [ ] Documentation updated for changed behaviour, configuration or interfaces.
- [ ] No secrets, tokens, credentials or personal data included.
- [ ] No unrelated formatting churn.
