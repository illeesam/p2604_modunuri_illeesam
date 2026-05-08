package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SySiteDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.base.sy.mapper.SySiteMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SySiteRepository;
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
@Transactional(readOnly = true)
public class BoSySiteService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final SySiteMapper sySiteMapper;
    private final SySiteRepository sySiteRepository;
    @PersistenceContext
    private EntityManager em;

    /** getList — 조회 */
    public List<SySiteDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return sySiteMapper.selectList(p);
    }

    /** getPageData — 조회 */
    public PageResult<SySiteDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(sySiteMapper.selectPageList(p), sySiteMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** getById — 조회 */
    public SySiteDto getById(String id) {
        SySiteDto dto = sySiteMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    /** create — 생성 */
    @Transactional
    public SySite create(SySite body) {
        body.setSiteId("SI" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        return sySiteRepository.save(body);
    }

    /** update — 수정 */
    @Transactional
    public SySiteDto update(String id, SySite body) {
        SySite entity = sySiteRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "siteId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        sySiteRepository.save(entity);
        em.flush();
        return getById(id);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SySite entity = sySiteRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        sySiteRepository.delete(entity);
        em.flush();
        if (sySiteRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SySite> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSiteId() != null)
            .map(SySite::getSiteId)
            .toList();
        if (!deleteIds.isEmpty()) {
            sySiteRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        List<SySite> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSiteId() != null)
            .toList();
        for (SySite row : updateRows) {
            SySite entity = sySiteRepository.findById(row.getSiteId())
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + row.getSiteId()));
            VoUtil.voCopyExclude(row, entity, "siteId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            sySiteRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        List<SySite> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SySite row : insertRows) {
            row.setSiteId("SI" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            sySiteRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}