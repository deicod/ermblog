package dataloaders

import (
        "github.com/deicod/ermblog/observability/metrics"
        "github.com/deicod/ermblog/orm/gen"
)

func configureEntityLoaders(*Loaders, *gen.Client, metrics.Collector) {}
