package com.shopjoy.ecBeBo.bo.ec.cm.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecBeBo.base.ec.cm.data.dto.CmBlogToggleUseDto;
import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmBlog;
import com.shopjoy.ecBeBo.base.ec.cm.repository.CmBlogRepository;
import com.shopjoy.ecBeBo.base.ec.cm.service.CmBlogService;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import com.shopjoy.ecBeBo.common.util.CmUtil;

/**
 * BO CmBlog 서비스 — base CmBlogService 위임 (thin wrapper) + toggleUse.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoCmBlogService {

    private final CmBlogService cmBlogService;
    private final CmBlogRepository cmBlogRepository;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public CmBlogDto.Item getById(String id) { return cmBlogService.getById(id); }
    /* 목록조회 */
    public List<CmBlogDto.Item> getList(CmBlogDto.Request req) { return cmBlogService.getList(req); }
    /* 페이지조회 */
    public BasePage<CmBlogDto.Item> getPageData(CmBlogDto.Request req) { return cmBlogService.getPageData(req); }

    @Transactional public CmBlog create(CmBlog body) {
        if (body.getUseYn() == null) body.setUseYn("Y");
        return cmBlogService.create(body);
    }
    @Transactional public CmBlog update(String id, CmBlog body) { return cmBlogService.update(id, body); }
    @Transactional public void delete(String id) { cmBlogService.delete(id); }
    @Transactional public void saveListBase(List<CmBlog> rows) { cmBlogService.saveListBase(rows); }

    /** toggleUse — useYn 전환 */
    @Transactional
    public CmBlogDto.Item toggleUse(String id, CmBlogToggleUseDto.Request req) {
        // [쿼리 메서드] 블로그 게시글 단건 조회
        CmBlog entity = cmBlogRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        entity.setUseYn(req.getUseYn());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 블로그 게시글 저장
        CmBlog saved = cmBlogRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return cmBlogService.getById(id);
    }
}
