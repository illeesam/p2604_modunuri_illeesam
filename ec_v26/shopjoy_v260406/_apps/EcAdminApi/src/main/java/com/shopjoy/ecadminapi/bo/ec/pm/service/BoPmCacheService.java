package com.shopjoy.ecadminapi.bo.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCache;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmCacheMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCacheRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class BoPmCacheService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final PmCacheMapper pmCacheMapper;
    private final PmCacheRepository pmCacheRepository;
    @PersistenceContext
    private EntityManager em;

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<PmCacheDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return pmCacheMapper.selectList(p);
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<PmCacheDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(pmCacheMapper.selectPageList(p), pmCacheMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** getById — 조회 */
    @Transactional(readOnly = true)
    public PmCacheDto getById(String id) {
        PmCacheDto dto = pmCacheMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    /** create — 생성 */
    @Transactional
    public PmCache create(PmCache body) {
        body.setCacheId("CA" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmCache saved = pmCacheRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    /** update — 수정 */
    @Transactional
    public PmCacheDto update(String id, PmCache body) {
        PmCache entity = pmCacheRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "cacheId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCache saved = pmCacheRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        PmCache entity = pmCacheRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        pmCacheRepository.delete(entity);
        em.flush();
        if (pmCacheRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }
    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PmCache> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getCacheId() != null)
            .map(PmCache::getCacheId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmCacheRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        for (PmCache row : rows) {
            if (!"U".equals(row.getRowStatus())) continue;
            String id = Objects.requireNonNull(row.getCacheId(), "cacheId must not be null");
            PmCache entity = pmCacheRepository.findById(id)
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
            VoUtil.voCopyExclude(row, entity, "cacheId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmCacheRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        for (PmCache row : rows) {
            if (!"I".equals(row.getRowStatus())) continue;
            row.setCacheId("CA" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmCacheRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
