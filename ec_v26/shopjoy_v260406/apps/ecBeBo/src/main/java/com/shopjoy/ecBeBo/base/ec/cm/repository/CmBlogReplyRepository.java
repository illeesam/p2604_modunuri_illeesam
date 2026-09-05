package com.shopjoy.ecBeBo.base.ec.cm.repository;

import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmBlogReply;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.cm.repository.qrydsl.QCmBlogReplyRepository;

public interface CmBlogReplyRepository extends JpaRepository<CmBlogReply, String>, QCmBlogReplyRepository {
}
