package com.shopjoy.ecBeBo.base.ec.pd.repository;

import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdReviewAttach;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdReviewAttachRepository;

public interface PdReviewAttachRepository extends JpaRepository<PdReviewAttach, String>, QPdReviewAttachRepository {
}
