package com.shopjoy.ecBeBo.base.ec.pd.repository;

import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdReviewComment;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl.QPdReviewCommentRepository;

public interface PdReviewCommentRepository extends JpaRepository<PdReviewComment, String>, QPdReviewCommentRepository {
}
