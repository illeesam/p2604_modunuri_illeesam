package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbm;
import com.shopjoy.ecadminapi.base.sy.mapper.SyBbmMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyBbmRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class BoSyBbmService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final SyBbmMapper mapper;
    private final SyBbmRepository repository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<SyBbmDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyBbmDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public SyBbmDto getById(String id) {
        SyBbmDto dto = mapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public SyBbm create(SyBbm body) {
        body.setBbmId("BB" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyBbm saved = repository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    @Transactional
    public SyBbmDto update(String id, SyBbm body) {
        SyBbm entity = repository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        entity.setSiteId(body.getSiteId());
        entity.setBbmCode(body.getBbmCode());
        entity.setBbmNm(body.getBbmNm());
        entity.setDispPath(body.getDispPath());
        entity.setBbmTypeCd(body.getBbmTypeCd());
        entity.setAllowComment(body.getAllowComment());
        entity.setAllowAttach(body.getAllowAttach());
        entity.setAllowLike(body.getAllowLike());
        entity.setContentTypeCd(body.getContentTypeCd());
        entity.setScopeTypeCd(body.getScopeTypeCd());
        entity.setSortOrd(body.getSortOrd());
        entity.setUseYn(body.getUseYn());
        entity.setBbmRemark(body.getBbmRemark());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyBbm saved = repository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        SyBbm entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }
}
